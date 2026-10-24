const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { promisify } = require('util');
const prisma = new PrismaClient();
const scryptAsync = promisify(crypto.scrypt);

const DEFAULT_ADMIN = {
  email: (process.env.ADMIN_EMAIL || 'admin@swarnaa.com').trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@123',
  name: process.env.ADMIN_NAME || 'Swarnaa Admin',
};

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
};

async function main() {
  console.log('Seeding data...');

  const adminExisting = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN.email } });
  if (!adminExisting) {
    await prisma.user.create({
      data: {
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        passwordHash: await hashPassword(DEFAULT_ADMIN.password),
        role: 'ADMIN',
      },
    });
    console.log(`Seeded admin ${DEFAULT_ADMIN.email}`);
  } else if (adminExisting.role !== 'ADMIN') {
    await prisma.user.update({
      where: { email: DEFAULT_ADMIN.email },
      data: { role: 'ADMIN' },
    });
    console.log(`Promoted ${DEFAULT_ADMIN.email} to ADMIN`);
  }

  const crochetCat = await prisma.category.upsert({
    where: { name_type: { name: 'crochet', type: 'PRODUCT' } },
    update: { type: 'PRODUCT' },
    create: { name: 'crochet', type: 'PRODUCT' },
  });

  const quillingCat = await prisma.category.upsert({
    where: { name_type: { name: 'quilling', type: 'PRODUCT' } },
    update: { type: 'PRODUCT' },
    create: { name: 'quilling', type: 'PRODUCT' },
  });

  const beadFlowersCat = await prisma.category.upsert({
    where: { name_type: { name: 'bead-flowers', type: 'PRODUCT' } },
    update: { type: 'PRODUCT' },
    create: { name: 'bead-flowers', type: 'PRODUCT' },
  });

  // Single default tutorial category — admin can add more in the Categories UI
  const generalTutCat = await prisma.category.upsert({
    where: { name_type: { name: 'General', type: 'TUTORIAL' } },
    update: { type: 'TUTORIAL' },
    create: { name: 'General', type: 'TUTORIAL' },
  });

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Lavender Dreams Tote', price: 1500, categoryId: crochetCat.id, image: '/crochet_tote.jpg', stock: 15 },
        { name: 'Blush Rose Handbag', price: 2100, categoryId: crochetCat.id, image: '/crochet_tote.jpg', stock: 8 },
        { name: 'Cozy Morning Blanket', price: 3500, categoryId: crochetCat.id, image: '/crochet_tote.jpg', stock: 5 },
        { name: 'Sleepy Bear Amigurumi', price: 850, categoryId: crochetCat.id, image: '/amigurumi_bear.jpg', stock: 20 },
        { name: 'Paper Blossom Frame', price: 1200, categoryId: quillingCat.id, image: '/quilled_art.jpg', stock: 12 },
        { name: 'Quilled Mandala Art', price: 2800, categoryId: quillingCat.id, image: '/quilled_art.jpg', stock: 3 },
        { name: 'Crystal Rose Bouquet', price: 1800, categoryId: beadFlowersCat.id, image: '/beaded_flower.jpg', stock: 25 },
        { name: 'French Beaded Lily', price: 950, categoryId: beadFlowersCat.id, image: '/beaded_flower.jpg', stock: 18 },
      ],
    });
    console.log('Seeded products');
  }

  const tutorialCount = await prisma.tutorial.count();
  if (tutorialCount === 0) {
    await prisma.tutorial.createMany({
      data: [
        {
          title: "Beginner's Guide to Macrame Wall Hangings",
          description: 'Learn the basic knots to create your first beautiful macrame wall hanging. Perfect for absolute beginners!',
          price: 0,
          isFree: true,
          image: 'https://images.unsplash.com/photo-1621376822295-a228fb531c3c?auto=format&fit=crop&q=80&w=800',
          level: 'Beginner',
          type: 'Video',
          duration: '45 mins',
          materials: JSON.stringify(['Cotton Macrame Cord (3mm)', 'Wooden Dowel (12 inch)', 'Scissors', 'Measuring Tape']),
          steps: JSON.stringify([
            'Cut 16 cords, each 2 meters long.',
            "Attach all cords to the dowel using Lark's Head knots.",
            'Create a row of Square Knots across all cords.',
            'Create alternating Square Knots to form a triangle pattern.',
            'Finish the edges and trim the fringe.',
          ]),
          categoryId: generalTutCat.id,
        },
        {
          title: 'Advanced Resin Floral Coasters',
          description: 'Master the 3D flower effect in resin using alcohol inks and specialized piping techniques.',
          price: 499,
          isFree: false,
          image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800',
          level: 'Advanced',
          type: 'Video',
          duration: '1 hr 15 mins',
          materials: JSON.stringify(['Epoxy Resin Kit', 'Silicone Coaster Molds', 'Alcohol Inks', 'Heat Gun', 'Piping Bags']),
          steps: JSON.stringify([
            'Mix resin according to package instructions.',
            'Pour a thin clear base layer and cure.',
            'Mix white resin for petals and pipe in a circular motion.',
            'Drop alcohol inks into the center.',
            'Use a heat gun to push the white resin inward, creating petals.',
            'Cure completely and unmold.',
          ]),
          categoryId: generalTutCat.id,
        },
        {
          title: 'Crochet Amigurumi Bunny Pattern',
          description: 'A detailed step-by-step written pattern with photos to crochet an adorable plush bunny.',
          price: 199,
          isFree: false,
          image: 'https://images.unsplash.com/photo-1606885376518-6c845b4104d4?auto=format&fit=crop&q=80&w=800',
          level: 'Intermediate',
          type: 'Text & Images',
          duration: 'Read: 15 mins',
          materials: JSON.stringify(['Chunky Yarn (White & Pink)', '4.5mm Crochet Hook', 'Safety Eyes', 'Stuffing', 'Yarn Needle']),
          steps: JSON.stringify([
            'Round 1: 6 single crochet in magic ring (6)',
            'Round 2: Increase in each stitch around (12)',
            'Round 3: [1 sc, 1 inc] repeat 6 times (18)',
            'Continue increasing to form the head.',
            'Attach safety eyes between rounds 10 and 11.',
            'Stuff firmly and decrease to close.',
          ]),
          categoryId: generalTutCat.id,
        },
        {
          title: 'DIY Paper Quilling Greeting Card',
          description: 'Create a stunning floral greeting card using basic paper quilling techniques.',
          price: 0,
          isFree: true,
          image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
          level: 'Beginner',
          type: 'Text & Images',
          duration: 'Read: 10 mins',
          materials: JSON.stringify(['Quilling Paper Strips', 'Slotted Quilling Tool', 'Craft Glue', 'Blank Card Stock']),
          steps: JSON.stringify([
            'Roll a tight coil and let it slightly uncoil to make a loose circle.',
            'Pinch one end of the circle to form a teardrop shape (petal).',
            'Make 5 identical teardrop petals.',
            'Glue the petals in a circle on the card stock.',
            'Add a tight yellow coil in the center for the flower core.',
          ]),
          categoryId: generalTutCat.id,
        },
      ],
    });
    console.log('Seeded tutorials');
  }

  const journalCount = await prisma.journalPost.count();
  if (journalCount === 0) {
    await prisma.journalPost.createMany({
      data: [
        {
          title: 'Studio notes from the worktable',
          lead: 'Small rituals that shape each handmade piece.',
          body: 'Every morning in the studio starts the same way — yarn sorted by colour, tools laid out, and a quiet cup of tea. Those small rituals keep our hands steady and our minds open for whatever we make next.',
          image: '/crochet_tote.jpg',
          publishedAt: new Date('2026-09-12'),
        },
        {
          title: 'Choosing yarn for soft gifts',
          lead: 'Texture, colour, and feel — what we look for first.',
          body: 'When we pick yarn for gifts, softness comes first. Then colour — something that feels like the person it is for. Finally, how it holds a stitch. That mix is what makes a tote or amigurumi feel personal.',
          image: '/amigurumi_bear.jpg',
          publishedAt: new Date('2026-09-28'),
        },
        {
          title: 'Behind a custom commission',
          lead: 'How a sketch becomes something you can hold.',
          body: 'A custom order usually begins with a short note and a mood. We sketch, share ideas, refine the details together, then craft. The best pieces are the ones that feel like a conversation made visible.',
          image: '/quilled_art.jpg',
          publishedAt: new Date('2026-10-08'),
        },
        {
          title: 'Beaded flowers for festive tables',
          lead: 'Tiny blooms that catch the light all evening.',
          body: 'Beaded flowers are patient work — each petal a loop of wire and glass. On a festive table they catch candlelight and feel special without being fragile in the usual way.',
          image: '/beaded_flower.jpg',
          publishedAt: new Date('2026-10-18'),
        },
      ],
    });
    console.log('Seeded journal posts');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
