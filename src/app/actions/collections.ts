'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getCollections(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;

  // Fetch data and total count in parallel for performance
  const [collections, totalCount] = await prisma.$transaction([
    prisma.collection.findMany({
      take: pageSize,
      skip: skip,
      include: { _count: { select: { bids: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.collection.count(),
  ]);

  return {
    collections,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}

export async function createCollection(data: { name: string; descriptions: string; stocks: number; price: number; userId: string; userName?: string }) {
  // Ensure the user exists (since the frontend may pass a hardcoded mock user ID)
  // This prevents the "foreign key constraint violated" error.
  const userName = data.userName || 'Mock User';
  await prisma.user.upsert({
    where: { id: data.userId },
    update: { name: userName },
    create: {
      id: data.userId,
      name: userName,
      email: `${data.userId}@example.com`,
    },
  });

  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      descriptions: data.descriptions,
      stocks: data.stocks,
      price: data.price,
      userId: data.userId
    }
  });
  revalidatePath('/');
  return collection;
}

export async function updateCollection(id: string, data: Partial<{ name: string; descriptions: string; stocks: number; price: number; userId?: string; userName?: string }>) {
  // Destructure to only pass fields that exist on the Collection model.
  // The form also sends `userId` and `userName`, which are not updatable collection fields.
  const { name, descriptions, stocks, price } = data;
  const collection = await prisma.collection.update({
    where: { id },
    data: { name, descriptions, stocks, price },
  });
  revalidatePath('/');
  return collection;
}

export async function deleteCollection(id: string) {
  // We must delete associated bids first, or use "onDelete: Cascade" in Prisma schema
  await prisma.bid.deleteMany({ where: { collectionId: id } });
  await prisma.collection.delete({ where: { id } });
  revalidatePath('/');
}
