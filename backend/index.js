require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');

const prisma = new PrismaClient();
const app = express();
const scryptAsync = promisify(crypto.scrypt);

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
};

const verifyPassword = async (password, stored) => {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const derived = await scryptAsync(password, salt, 64);
  const hashBuf = Buffer.from(hash, 'hex');
  const derivedBuf = Buffer.from(derived);
  if (hashBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, derivedBuf);
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
});

const UPI_ID = process.env.UPI_ID || 'swarnaa@bank';
const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'Swarnaa Creations';
const PUBLIC_BASE = `http://localhost:${process.env.PORT || 3001}`;

// Default admin account (override with ADMIN_EMAIL / ADMIN_PASSWORD in .env)
const DEFAULT_ADMIN = {
  email: (process.env.ADMIN_EMAIL || 'admin@swarnaa.com').trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@123',
  name: process.env.ADMIN_NAME || 'Swarnaa Admin',
};

const ensureDefaultAdmin = async () => {
  const existing = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN.email } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({
        where: { email: DEFAULT_ADMIN.email },
        data: { role: 'ADMIN' },
      });
      console.log(`Updated ${DEFAULT_ADMIN.email} to ADMIN role`);
    }
    return;
  }
  const passwordHash = await hashPassword(DEFAULT_ADMIN.password);
  await prisma.user.create({
    data: {
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created default admin: ${DEFAULT_ADMIN.email}`);
};

const displayOrderId = (id) => `#SW-${1000 + id}`;

const formatOrderItemsSummary = (items) =>
  items
    .map((item) => {
      const name = item.product?.name || item.tutorial?.title || 'Item';
      const kind = item.tutorialId ? 'Tutorial' : 'Product';
      return `${item.quantity}x ${name} (${kind})`;
    })
    .join(', ');

const buildUpiDeepLink = ({ amount, orderRef }) => {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: orderRef,
  });
  return `upi://pay?${params.toString()}`;
};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ========================
// AUTH API
// ========================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const phone = (req.body.phone || '').trim() || null;
    const password = req.body.password || '';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password should be at least 4 characters.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: 'CUSTOMER' },
    });

    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Enter email and password.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sign in.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Enter your email address.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Same response shape whether or not the account exists (avoid email enumeration),
    // but return a code when found so local/dev can reset without SMTP.
    if (!user) {
      return res.json({
        ok: true,
        message: 'If an account exists for that email, a reset code was issued.',
      });
    }

    const resetCode = String(crypto.randomInt(100000, 1000000));
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode, resetCodeExpires },
    });

    console.log(`[password-reset] ${email} → code ${resetCode} (expires in 15 min)`);

    res.json({
      ok: true,
      message: 'Enter the reset code below and choose a new password.',
      // Shown in UI until email delivery is wired up
      resetCode,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start password reset.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const password = req.body.password || '';

    if (!email || !code || !password) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password should be at least 4 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      !user.resetCode ||
      !user.resetCodeExpires ||
      user.resetCode !== code ||
      user.resetCodeExpires < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    res.json({ ok: true, message: 'Password updated. You can sign in now.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ========================
// PRODUCTS API
// ========================

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    const formatted = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      image: p.image,
      category: p.category.name,
      categoryId: p.categoryId
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, price, stock, categoryId, image } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, price: parseFloat(price), stock: parseInt(stock), categoryId: parseInt(categoryId), image }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ========================
// CATEGORIES API
// ========================

const normalizeCategoryType = (type) => {
  const raw = String(type || 'PRODUCT').trim().toUpperCase();
  if (raw === 'TUTORIAL' || raw === 'TUTORIALS' || raw === 'LEARNING') return 'TUTORIAL';
  if (raw === 'PRODUCT' || raw === 'PRODUCTS' || raw === 'SHOP') return 'PRODUCT';
  // Legacy UI values: "Product" / "Tutorial"
  if (raw.startsWith('TUT')) return 'TUTORIAL';
  return 'PRODUCT';
};

app.get('/api/categories', async (req, res) => {
  try {
    const { type } = req.query;
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true, tutorials: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    // Format to give a single count; normalize legacy type strings
    let formatted = categories.map(c => {
      const normalizedType = normalizeCategoryType(c.type);
      return {
        id: c.id,
        name: c.name,
        type: normalizedType,
        count: normalizedType === 'PRODUCT' ? c._count.products : c._count.tutorials
      };
    });
    if (type) {
      const wanted = normalizeCategoryType(type);
      formatted = formatted.filter((c) => c.type === wanted);
    }
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  const name = (req.body.name || '').trim();
  const type = normalizeCategoryType(req.body.type);
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  try {
    const category = await prisma.category.create({
      data: { name, type }
    });
    res.status(201).json({ ...category, count: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid category id.' });

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, tutorials: true } },
      },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const linked = category._count.products + category._count.tutorials;
    const force = String(req.query.force || '') === '1';

    if (linked > 0 && !force) {
      return res.status(409).json({
        error: `This category is used by ${linked} item(s). Reassign or delete those items first, or confirm force-delete.`,
        count: linked,
        products: category._count.products,
        tutorials: category._count.tutorials,
      });
    }

    if (linked > 0 && force) {
      // Move linked items onto another category of the same type when possible
      const fallback = await prisma.category.findFirst({
        where: { type: category.type, id: { not: id } },
        orderBy: { id: 'asc' },
      });
      if (!fallback) {
        return res.status(409).json({
          error: 'Cannot force-delete the last category while items still use it. Create another category first, or remove the items.',
        });
      }
      if (category._count.products > 0) {
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallback.id },
        });
      }
      if (category._count.tutorials > 0) {
        await prisma.tutorial.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallback.id },
        });
      }
    }

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ========================
// TUTORIALS API
// ========================

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toTutorial = (t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  price: t.price,
  isFree: t.isFree || t.price === 0,
  category: t.category?.name || t.category,
  categoryId: t.categoryId,
  videoUrl: t.videoUrl,
  image: t.image,
  level: t.level || 'Beginner',
  type: t.type || 'Video',
  duration: t.duration || '',
  materials: parseJsonArray(t.materials),
  steps: parseJsonArray(t.steps),
});

app.get('/api/tutorials', async (req, res) => {
  try {
    const tutorials = await prisma.tutorial.findMany({
      include: { category: true },
      orderBy: { id: 'asc' },
    });
    res.json(tutorials.map(toTutorial));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tutorials' });
  }
});

app.get('/api/tutorials/:id', async (req, res) => {
  try {
    const tutorial = await prisma.tutorial.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!tutorial) return res.status(404).json({ error: 'Tutorial not found' });
    res.json(toTutorial(tutorial));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tutorial' });
  }
});

app.post('/api/tutorials', async (req, res) => {
  const {
    title, description, price, isFree, categoryId, videoUrl,
    image, level, type, duration, materials, steps,
  } = req.body;
  try {
    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        description,
        price: parseFloat(price) || 0,
        isFree: Boolean(isFree) || Number(price) === 0,
        categoryId: parseInt(categoryId),
        videoUrl,
        image,
        level,
        type,
        duration,
        materials: materials ? JSON.stringify(materials) : null,
        steps: steps ? JSON.stringify(steps) : null,
      },
      include: { category: true },
    });
    res.status(201).json(toTutorial(tutorial));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tutorial' });
  }
});

app.delete('/api/tutorials/:id', async (req, res) => {
  try {
    await prisma.tutorial.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tutorial' });
  }
});

// ========================
// JOURNAL API
// ========================

const toJournal = (j) => ({
  id: j.id,
  title: j.title,
  lead: j.lead,
  body: j.body,
  image: j.image,
  publishedAt: j.publishedAt,
  createdAt: j.createdAt,
});

app.get('/api/journals', async (req, res) => {
  try {
    const posts = await prisma.journalPost.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    res.json(posts.map(toJournal));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

app.get('/api/journals/:id', async (req, res) => {
  try {
    const post = await prisma.journalPost.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!post) return res.status(404).json({ error: 'Journal post not found' });
    res.json(toJournal(post));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch journal post' });
  }
});


// ========================
// PAYMENT CONFIG + ORDERS API
// ========================

app.get('/api/payment-config', (req, res) => {
  res.json({
    upiId: UPI_ID,
    payeeName: UPI_PAYEE_NAME,
  });
});

app.get('/api/orders', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    const orders = await prisma.order.findMany({
      where: email ? { customerEmail: email } : undefined,
      include: {
        items: {
          include: { product: true, tutorial: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = orders.map(o => {
      const hasTutorial = o.items.some((item) => Boolean(item.tutorialId));
      const hasProduct = o.items.some((item) => Boolean(item.productId));
      return {
        id: displayOrderId(o.id),
        originalId: o.id,
        customer: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        date: o.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: o.status,
        total: o.totalAmount,
        items: formatOrderItemsSummary(o.items),
        itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        hasTutorial,
        hasProduct,
        tutorialIds: o.items.map((item) => item.tutorialId).filter(Boolean),
        shippingAddress: o.shippingAddress,
        shippingCity: o.shippingCity,
        shippingState: o.shippingState,
        shippingPincode: o.shippingPincode,
        paymentScreenshotUrl: o.paymentScreenshotUrl
          ? `${PUBLIC_BASE}${o.paymentScreenshotUrl}`
          : null
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/** Create order + return UPI QR payload for that order */
app.post('/api/orders/initiate', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPincode,
      items,
    } = req.body;

    if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer details and items are required' });
    }

    const normalizedItems = items.map((item) => {
      const isTutorial = item.packSize === 'digital' || Boolean(item.tutorialId);
      const productId = isTutorial ? null : parseInt(item.productId || item.product?.id, 10) || null;
      const tutorialId = isTutorial ? parseInt(item.tutorialId || item.productId || item.product?.id, 10) || null : null;
      return {
        productId,
        tutorialId,
        quantity: parseInt(item.quantity, 10) || 1,
        price: parseFloat(item.price),
      };
    });

    if (normalizedItems.some((i) => Number.isNaN(i.price) || i.price < 0 || (!i.productId && !i.tutorialId))) {
      return res.status(400).json({ error: 'Invalid order items' });
    }

    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const email = String(customerEmail).trim().toLowerCase();
    const account = await prisma.user.findUnique({ where: { email } });

    const tutorialIdsInCart = [...new Set(
      normalizedItems.map((i) => i.tutorialId).filter(Boolean)
    )];

    if (tutorialIdsInCart.length > 0) {
      const alreadyOwned = await prisma.orderItem.findMany({
        where: {
          tutorialId: { in: tutorialIdsInCart },
          order: {
            customerEmail: email,
            paymentScreenshotUrl: { not: null },
          },
        },
        select: { tutorialId: true },
        distinct: ['tutorialId'],
      });

      if (alreadyOwned.length > 0) {
        return res.status(409).json({
          error: 'You already own one or more of these tutorials. They are available in My Learning — no need to pay again.',
          alreadyOwnedTutorialIds: alreadyOwned.map((r) => r.tutorialId),
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: account?.id || null,
        customerName,
        customerEmail: email,
        customerPhone: customerPhone || null,
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        shippingState: shippingState || null,
        shippingPincode: shippingPincode || null,
        totalAmount,
        status: 'PENDING_VERIFICATION',
        items: { create: normalizedItems },
      },
    });

    const ref = displayOrderId(order.id);
    const upiDeepLink = buildUpiDeepLink({ amount: totalAmount, orderRef: ref });

    res.status(201).json({
      id: order.id,
      displayId: ref,
      totalAmount,
      status: order.status,
      upiId: UPI_ID,
      payeeName: UPI_PAYEE_NAME,
      upiDeepLink,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to initiate order' });
  }
});

/** Attach payment screenshot after customer pays */
app.post('/api/orders/:id/confirm', upload.single('screenshot'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentScreenshotUrl: `/uploads/${req.file.filename}`,
        status: 'PENDING_VERIFICATION',
      },
      include: { items: true },
    });

    const unlockedTutorialIds = [...new Set(
      order.items.map((item) => item.tutorialId).filter(Boolean)
    )];

    res.json({
      id: order.id,
      displayId: displayOrderId(order.id),
      status: order.status,
      paymentScreenshotUrl: `${PUBLIC_BASE}${order.paymentScreenshotUrl}`,
      unlockedTutorialIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/** Tutorials unlocked for a customer (from submitted payment orders) */
app.get('/api/learning', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const orders = await prisma.order.findMany({
      where: {
        customerEmail: email,
        paymentScreenshotUrl: { not: null },
      },
      include: { items: true },
    });

    const unlockedTutorialIds = [...new Set(
      orders.flatMap((o) => o.items.map((item) => item.tutorialId).filter(Boolean))
    )];

    res.json({ unlockedTutorialIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch learning library' });
  }
});

/** Legacy single-step create (kept for admin tools) */
app.post('/api/orders', upload.single('screenshot'), async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, totalAmount, items } = req.body;
    const parsedItems = JSON.parse(items);
    const screenshotPath = req.file ? `/uploads/${req.file.filename}` : null;

    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        totalAmount: parseFloat(totalAmount),
        paymentScreenshotUrl: screenshotPath,
        items: {
          create: parsedItems.map(item => ({
            productId: item.productId || null,
            tutorialId: item.tutorialId || null,
            quantity: item.quantity || 1,
            price: parseFloat(item.price)
          }))
        }
      }
    });
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ========================
// HERO IMAGES API
// ========================

const toHeroImage = (row) => ({
  id: row.id,
  side: row.side,
  sortOrder: row.sortOrder,
  imageUrl: row.imageUrl.startsWith('http')
    ? row.imageUrl
    : `http://localhost:${process.env.PORT || 3001}${row.imageUrl}`,
  createdAt: row.createdAt
});

app.get('/api/hero-images', async (req, res) => {
  try {
    const images = await prisma.heroImage.findMany({
      orderBy: [{ side: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }]
    });
    res.json(images.map(toHeroImage));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch hero images' });
  }
});

app.post('/api/hero-images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const side = (req.body.side || 'LEFT').toUpperCase();
    if (side !== 'LEFT' && side !== 'RIGHT') {
      return res.status(400).json({ error: 'side must be LEFT or RIGHT' });
    }
    const maxOrder = await prisma.heroImage.aggregate({
      where: { side },
      _max: { sortOrder: true }
    });
    const image = await prisma.heroImage.create({
      data: {
        side,
        imageUrl: `/uploads/${req.file.filename}`,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
      }
    });
    res.status(201).json(toHeroImage(image));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload hero image' });
  }
});

app.delete('/api/hero-images/:id', async (req, res) => {
  try {
    await prisma.heroImage.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete hero image' });
  }
});

const PORT = process.env.PORT || 3001;

ensureDefaultAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log(`Admin login: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    });
  })
  .catch((err) => {
    console.error('Failed to ensure default admin:', err);
    process.exit(1);
  });
