import { PrismaClient } from '../src/generated/prisma/client';
import { faker } from '@faker-js/faker';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('Cleaning database...');
  // Clear existing data to avoid unique constraint errors during re-runs
  await prisma.bid.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding 10 users...');
  const users = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
        },
      })
    )
  );

  console.log('Seeding 100 collections...');
  const collections = [];
  for (let i = 0; i < 100; i++) {
    // Pick a random user to be the owner
    const owner = users[Math.floor(Math.random() * users.length)];

    const collection = await prisma.collection.create({
      data: {
        name: faker.commerce.productName(),
        descriptions: faker.commerce.productDescription(),
        stocks: faker.number.int({ min: 1, max: 50 }),
        price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
        userId: owner.id,
      },
    });
    collections.push(collection);
  }

  console.log('Seeding 10 bids per collection (1000 total)...');
  for (const collection of collections) {
    const bidData = Array.from({ length: 10 }).map(() => {
      // Pick a random user to be the bidder
      const bidder = users[Math.floor(Math.random() * users.length)];

      return {
        collectionId: collection.id,
        userId: bidder.id,
        // Generate a price around the collection's base price
        price: parseFloat(
          faker.commerce.price({
            min: collection.price * 0.8,
            max: collection.price * 1.5
          })
        ),
        status: 'pending',
      };
    });

    await prisma.bid.createMany({
      data: bidData,
    });
  }

  console.log('Seeding complete! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });