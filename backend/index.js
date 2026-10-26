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

const displayOrderId = (id) => `SC-${String(id).padStart(4, '0')}`;

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
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { id: 'desc' }
    });
    const formatted = products.map(p => {
      let gallery = [];
      try {
        gallery = p.images ? JSON.parse(p.images) : [];
      } catch (e) {
        gallery = [];
      }
      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: p.price,
        stock: p.stock,
        image: p.image || '/crochet_tote.jpg',
        images: Array.isArray(gallery) && gallery.length > 0 ? gallery : [p.image || '/crochet_tote.jpg'],
        category: p.category.name,
        categoryId: p.categoryId,
        rating: p.rating ?? 5.0,
        allowCustomText: p.allowCustomText ?? true,
        bulkDiscountPct: p.bulkDiscountPct ?? 20
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true }
    });
    if (!p) return res.status(404).json({ error: 'Product not found' });
    let gallery = [];
    try {
      gallery = p.images ? JSON.parse(p.images) : [];
    } catch (e) {
      gallery = [];
    }
    res.json({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      stock: p.stock,
      image: p.image || '/crochet_tote.jpg',
      images: Array.isArray(gallery) && gallery.length > 0 ? gallery : [p.image || '/crochet_tote.jpg'],
      category: p.category.name,
      categoryId: p.categoryId,
      rating: p.rating ?? 5.0,
      allowCustomText: p.allowCustomText ?? true,
      bulkDiscountPct: p.bulkDiscountPct ?? 20
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', upload.array('imageFiles', 10), async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      categoryId,
      description,
      primaryIndex = 0
    } = req.body;

    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      uploadedUrls = req.files.map((f) => `/uploads/${f.filename}`);
    } else if (req.body.existingImages) {
      try {
        uploadedUrls = JSON.parse(req.body.existingImages);
      } catch (e) {
        uploadedUrls = [req.body.existingImages];
      }
    }

    if (uploadedUrls.length === 0) {
      uploadedUrls = ['/crochet_tote.jpg'];
    }

    const pIdx = Math.min(Math.max(0, parseInt(primaryIndex) || 0), uploadedUrls.length - 1);
    const primaryImage = uploadedUrls[pIdx] || uploadedUrls[0];

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock || 0),
        categoryId: parseInt(categoryId),
        image: primaryImage,
        images: JSON.stringify(uploadedUrls),
      },
      include: { category: true }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', upload.array('imageFiles', 10), async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      categoryId,
      description,
      primaryIndex = 0
    } = req.body;

    // Existing images kept
    let existingList = [];
    if (req.body.existingImages) {
      try {
        existingList = JSON.parse(req.body.existingImages);
      } catch (e) {
        existingList = [req.body.existingImages];
      }
    }

    let newlyUploadedUrls = [];
    if (req.files && req.files.length > 0) {
      newlyUploadedUrls = req.files.map((f) => `/uploads/${f.filename}`);
    }

    let allImages = [...existingList, ...newlyUploadedUrls];
    if (allImages.length === 0) {
      allImages = ['/crochet_tote.jpg'];
    }

    const pIdx = Math.min(Math.max(0, parseInt(primaryIndex) || 0), allImages.length - 1);
    const primaryImage = allImages[pIdx] || allImages[0];

    const updated = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock || 0),
        categoryId: parseInt(categoryId),
        image: primaryImage,
        images: JSON.stringify(allImages),
      },
      include: { category: true }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
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

app.post('/api/tutorials', upload.array('imageFiles', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      categoryId,
      videoUrl,
      level,
      type,
      duration,
      primaryIndex = 0
    } = req.body;

    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      uploadedUrls = req.files.map((f) => `/uploads/${f.filename}`);
    } else if (req.body.existingImages) {
      try {
        uploadedUrls = JSON.parse(req.body.existingImages);
      } catch (e) {
        uploadedUrls = [req.body.existingImages];
      }
    }

    if (uploadedUrls.length === 0) {
      uploadedUrls = ['/crochet_tote.jpg'];
    }

    const pIdx = Math.min(Math.max(0, parseInt(primaryIndex) || 0), uploadedUrls.length - 1);
    const primaryImage = uploadedUrls[pIdx] || uploadedUrls[0];

    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        description: description || '',
        price: parseFloat(price) || 0,
        isFree: Number(price) === 0,
        categoryId: parseInt(categoryId),
        videoUrl: videoUrl || '',
        image: primaryImage,
        level: level || 'Beginner',
        type: type || 'Video',
        duration: duration || '',
        materials: JSON.stringify(uploadedUrls), // keep all images list accessible
      },
      include: { category: true },
    });
    res.status(201).json(toTutorial(tutorial));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tutorial' });
  }
});

app.put('/api/tutorials/:id', upload.array('imageFiles', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      categoryId,
      videoUrl,
      level,
      type,
      duration,
      primaryIndex = 0
    } = req.body;

    let existingList = [];
    if (req.body.existingImages) {
      try {
        existingList = JSON.parse(req.body.existingImages);
      } catch (e) {
        existingList = [req.body.existingImages];
      }
    }

    let newlyUploadedUrls = [];
    if (req.files && req.files.length > 0) {
      newlyUploadedUrls = req.files.map((f) => `/uploads/${f.filename}`);
    }

    let allImages = [...existingList, ...newlyUploadedUrls];
    if (allImages.length === 0) {
      allImages = ['/crochet_tote.jpg'];
    }

    const pIdx = Math.min(Math.max(0, parseInt(primaryIndex) || 0), allImages.length - 1);
    const primaryImage = allImages[pIdx] || allImages[0];

    const updated = await prisma.tutorial.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description: description || '',
        price: parseFloat(price) || 0,
        isFree: Number(price) === 0,
        categoryId: parseInt(categoryId),
        videoUrl: videoUrl || '',
        image: primaryImage,
        level: level || 'Beginner',
        type: type || 'Video',
        duration: duration || '',
        materials: JSON.stringify(allImages),
      },
      include: { category: true },
    });
    res.json(toTutorial(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update tutorial' });
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
        itemsList: o.items.map((item) => ({
          id: item.id,
          name: item.product?.name || item.tutorial?.title || 'Item',
          type: item.tutorialId ? 'Tutorial' : 'Product',
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.product?.imageUrl || item.tutorial?.thumbnailUrl || null,
        })),
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

    // Automatically send invoice email to customer for regular order
    if (existing.customerEmail) {
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
              tutorial: true,
            }
          }
        }
      }).then(fullOrder => {
        if (fullOrder) {
          sendRegularOrderInvoiceEmail(fullOrder);
        }
      }).catch(e => console.error('[Auto Invoice Send Error]:', e));
    }

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
      data: { status },
      include: {
        items: {
          include: {
            product: true,
            tutorial: true
          }
        }
      }
    });

    // If order was confirmed (PAID or DELIVERED) and has customer email, auto-send invoice email
    if ((status === 'PAID' || status === 'DELIVERED') && order.customerEmail) {
      sendRegularOrderInvoiceEmail(order);
    }

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

// ========================
// HOME PAGE CONTENT API
// ========================

const DEFAULT_HOME_CONTENT = {
  heroTitle: 'Something special is on the way.',
  heroTitleSpan: 'on the way.',
  heroDescription: 'We’re creating handmade magic to make your moments more special and your gifts more meaningful.',
  heroPrimaryBtn: 'Explore shop',
  heroPrimaryLink: '/shop',
  heroSecondaryBtn: 'Chat on WhatsApp',
  whatsappMessage: 'Hi! I am interested in Swarnaa Creations.',
  customTitle: 'Made for your moment',
  customDesc: 'Need a one-of-a-kind gift or a bulk set for an event? Tell us what you imagine — we’ll craft it with you.',
  customBtnText: 'Request a custom order',
  closingTitle: 'Find a piece that feels like you.',
  closingDesc: 'Browse the shop, or start a custom conversation.',
  featuredProductIds: null,
  featuredTutorialIds: null,
  featuredJournalIds: null
};

app.get('/api/home-content', async (req, res) => {
  try {
    let content = await prisma.homePageContent.findFirst();
    if (!content) {
      content = await prisma.homePageContent.create({
        data: DEFAULT_HOME_CONTENT
      });
    }
    res.json(content);
  } catch (error) {
    console.error(error);
    res.json(DEFAULT_HOME_CONTENT);
  }
});

app.put('/api/home-content', async (req, res) => {
  try {
    const data = {
      heroTitle: req.body.heroTitle || DEFAULT_HOME_CONTENT.heroTitle,
      heroTitleSpan: req.body.heroTitleSpan || DEFAULT_HOME_CONTENT.heroTitleSpan,
      heroDescription: req.body.heroDescription || DEFAULT_HOME_CONTENT.heroDescription,
      heroPrimaryBtn: req.body.heroPrimaryBtn || DEFAULT_HOME_CONTENT.heroPrimaryBtn,
      heroPrimaryLink: req.body.heroPrimaryLink || DEFAULT_HOME_CONTENT.heroPrimaryLink,
      heroSecondaryBtn: req.body.heroSecondaryBtn || DEFAULT_HOME_CONTENT.heroSecondaryBtn,
      whatsappMessage: req.body.whatsappMessage || DEFAULT_HOME_CONTENT.whatsappMessage,
      customTitle: req.body.customTitle || DEFAULT_HOME_CONTENT.customTitle,
      customDesc: req.body.customDesc || DEFAULT_HOME_CONTENT.customDesc,
      customBtnText: req.body.customBtnText || DEFAULT_HOME_CONTENT.customBtnText,
      closingTitle: req.body.closingTitle || DEFAULT_HOME_CONTENT.closingTitle,
      closingDesc: req.body.closingDesc || DEFAULT_HOME_CONTENT.closingDesc,
      featuredProductIds: req.body.featuredProductIds !== undefined 
        ? (Array.isArray(req.body.featuredProductIds) ? JSON.stringify(req.body.featuredProductIds) : req.body.featuredProductIds) 
        : null,
      featuredTutorialIds: req.body.featuredTutorialIds !== undefined 
        ? (Array.isArray(req.body.featuredTutorialIds) ? JSON.stringify(req.body.featuredTutorialIds) : req.body.featuredTutorialIds) 
        : null,
      featuredJournalIds: req.body.featuredJournalIds !== undefined 
        ? (Array.isArray(req.body.featuredJournalIds) ? JSON.stringify(req.body.featuredJournalIds) : req.body.featuredJournalIds) 
        : null,
    };

    let existing = await prisma.homePageContent.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.homePageContent.update({
        where: { id: existing.id },
        data
      });
    } else {
      updated = await prisma.homePageContent.create({
        data
      });
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update homepage content' });
  }
});

// ========================
// CUSTOM REQUESTS API
// ========================

// GET all custom requests (Admin)
app.get('/api/custom-requests', async (req, res) => {
  try {
    const list = await prisma.customRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch custom requests' });
  }
});

// POST submit custom commission request (with optional image uploads)
app.post('/api/custom-requests', upload.array('referenceImages', 5), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      orderVolume,
      quantity,
      description,
      deadline,
      budget
    } = req.body;

    if (!customerName || !customerEmail || !description) {
      return res.status(400).json({ error: 'Name, email, and description are required' });
    }

    const count = await prisma.customRequest.count();
    const requestId = `REQ-${1001 + count}`;

    const uploadedUrls = (req.files || []).map(f => `/uploads/${f.filename}`);

    const item = await prisma.customRequest.create({
      data: {
        requestId,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim().toLowerCase(),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        orderVolume: orderVolume || 'single',
        quantity: parseInt(quantity, 10) || 1,
        description: String(description).trim(),
        deadline: deadline || null,
        budget: budget ? String(budget).trim() : null,
        imageUrls: uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null,
        status: 'Pending'
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit custom commission request' });
  }
});

// Email transporter for automated invoice dispatch
const nodemailer = require('nodemailer');

const createEmailTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Fallback test/log account if credentials are not configured
  return null;
};

const sendInvoiceEmail = async (customReq) => {
  const invNumber = customReq.invoiceNumber || `SC-${String(customReq.id).padStart(4, '0')}`;
  const amount = customReq.quotedAmount || customReq.budget || 'N/A';
  const phone = process.env.VITE_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '919445542398';
  
  const subject = `Order Confirmed & Invoice ${invNumber} - Swarnaa Creations`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #E20171; margin: 0; font-size: 26px; letter-spacing: 1px;">SWARNAA CREATIONS</h1>
        <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">Handcrafted Elegance, Fine Crochet & Artisanal Keepsakes</p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0 0;">31, Thiruvalluvar Street, New Perungalathur, Chennai - 600063</p>
      </div>

      <div style="background: #FDF2F8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 6px; color: #E20171; font-size: 16px;">Order Confirmed & Payment Verified ✓</h3>
        <p style="margin: 0; color: #4B5563; font-size: 14px;">
          Dear <strong>${customReq.customerName}</strong>, thank you! Your payment has been verified and our artisans have commenced handcrafting your order.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 0; color: #6B7280;">Invoice Number:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">${invNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 0; color: #6B7280;">Request ID:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">${customReq.requestId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 0; color: #6B7280;">Order Details:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">${customReq.quantity}x (${customReq.orderVolume === 'bulk' ? 'Bulk Order' : 'Single Piece'})</td>
        </tr>
        ${customReq.deadline ? `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 0; color: #6B7280;">Target Deadline:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">${customReq.deadline}</td>
        </tr>` : ''}
        <tr style="border-bottom: 2px solid #E20171;">
          <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #111827;">Total Paid:</td>
          <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #E20171;">Rs ${amount}</td>
        </tr>
      </table>

      <div style="background: #F9FAFB; padding: 14px; border-radius: 8px; font-size: 13px; color: #4B5563; margin-bottom: 20px;">
        <strong>Custom Specification:</strong>
        <p style="margin: 6px 0 0; font-style: italic;">"${customReq.description}"</p>
      </div>

      <div style="text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        Swarnaa Creations • WhatsApp: +${phone} • support@swarnaacreations.com • www.swarnaacreations.com
      </div>
    </div>
  `;

  try {
    const transporter = createEmailTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Swarnaa Creations" <orders@swarnaa.com>',
        to: customReq.customerEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[Invoice Email] Successfully dispatched to ${customReq.customerEmail} for ${invNumber}`);
    } else {
      console.log(`[Invoice Email Simulation] To: ${customReq.customerEmail} | Subject: ${subject}`);
    }
  } catch (mailErr) {
    console.error('[Invoice Email Error]:', mailErr);
  }
};

const sendRegularOrderInvoiceEmail = async (order) => {
  const invNumber = `SC-${String(order.id).padStart(4, '0')}`;
  const phone = process.env.VITE_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '919445542398';
  const subject = `Order Confirmed & Invoice ${invNumber} - Swarnaa Creations`;
  const itemsHtml = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 10px 0; color: #111827;">${item.product ? item.product.name : (item.tutorial ? item.tutorial.title : 'Art Piece / Tutorial')}</td>
      <td style="padding: 10px 0; text-align: center; color: #6B7280;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827;">Rs ${item.price * item.quantity}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #E20171; margin: 0; font-size: 26px; letter-spacing: 1px;">SWARNAA CREATIONS</h1>
        <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">Handcrafted Elegance, Fine Crochet & Artisanal Keepsakes</p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0 0;">31, Thiruvalluvar Street, New Perungalathur, Chennai - 600063</p>
      </div>

      <div style="background: #FDF2F8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 6px; color: #E20171; font-size: 16px;">Order Confirmed & Payment Verified ✓</h3>
        <p style="margin: 0; color: #4B5563; font-size: 14px;">
          Dear <strong>${order.customerName || 'Customer'}</strong>, your order has been confirmed! Your invoice is below.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 0; color: #6B7280;">Invoice Number:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">${invNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 0; color: #6B7280;">Order Ref:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">${invNumber}</td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <thead>
          <tr style="background: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
            <th style="padding: 8px 0; text-align: left; color: #6B7280;">Item</th>
            <th style="padding: 8px 0; text-align: center; color: #6B7280;">Qty</th>
            <th style="padding: 8px 0; text-align: right; color: #6B7280;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="border-top: 2px solid #E20171;">
            <td colspan="2" style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #111827;">Total Paid:</td>
            <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #E20171;">Rs ${order.totalAmount}</td>
          </tr>
        </tfoot>
      </table>

      ${order.shippingAddress ? `
      <div style="background: #F9FAFB; padding: 14px; border-radius: 8px; font-size: 13px; color: #4B5563; margin-bottom: 20px;">
        <strong>Shipping Destination:</strong>
        <p style="margin: 4px 0 0;">${order.shippingAddress}, ${[order.shippingCity, order.shippingState, order.shippingPincode].filter(Boolean).join(', ')}</p>
      </div>` : ''}

      <div style="text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        Swarnaa Creations • WhatsApp: +${phone} • support@swarnaacreations.com • www.swarnaacreations.com
      </div>
    </div>
  `;

  try {
    const transporter = createEmailTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Swarnaa Creations" <orders@swarnaa.com>',
        to: order.customerEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[Regular Order Invoice Email] Dispatched to ${order.customerEmail} for ${invNumber}`);
    } else {
      console.log(`[Regular Order Invoice Email Simulation] To: ${order.customerEmail} | Subject: ${subject}`);
    }
  } catch (mailErr) {
    console.error('[Regular Order Invoice Email Error]:', mailErr);
  }
};

// PATCH quote price on custom request (Admin)
app.patch('/api/custom-requests/:id/quote', async (req, res) => {
  try {
    const { id } = req.params;
    const { quotedAmount, adminNotes } = req.body;

    const updated = await prisma.customRequest.update({
      where: { id: parseInt(id, 10) },
      data: {
        quotedAmount: quotedAmount ? parseFloat(quotedAmount) : null,
        adminNotes: adminNotes || null,
        status: 'Quoted',
      }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record quote' });
  }
});

// POST upload payment proof screenshot (Admin) -> Generates invoice & sends confirmation email
app.post('/api/custom-requests/:id/payment-proof', upload.single('paymentProof'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof screenshot file is required' });
    }

    const proofUrl = `/uploads/${req.file.filename}`;
    const invNumber = `SC-${String(id).padStart(4, '0')}`;

    const updated = await prisma.customRequest.update({
      where: { id: parseInt(id, 10) },
      data: {
        paymentProofUrl: proofUrl,
        invoiceNumber: invNumber,
        invoiceSentAt: new Date(),
        status: 'Paid',
      }
    });

    // Automatically send confirmation & invoice email to customer
    sendInvoiceEmail(updated);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// PATCH update custom request status (Admin - Quoted, Declined, Pending, Paid)
app.patch('/api/custom-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.customRequest.update({
      where: { id: parseInt(id, 10) },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update custom request status' });
  }
});



// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '../dist');
app.use(express.static(frontendDistPath));

// SPA fallback: any request not handled by previous routes serves index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Please run "npm run build".');
    }
  });
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
