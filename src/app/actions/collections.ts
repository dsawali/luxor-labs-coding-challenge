'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getCollections(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;

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

export async function createCollection(data: {
  name: string;
  descriptions: string;
  stocks: number;
  price: number;
  userId: string;
  userName?: string;
}) {
  if (!data.price || data.price <= 0) {
    throw new Error('Bid price must be greater than 0.');
  }

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
      userId: data.userId,
    },
  });
  revalidatePath('/');
  return collection;
}

export async function updateCollection(
  id: string,
  data: Partial<{
    name: string;
    descriptions: string;
    stocks: number;
    price: number;
    userId?: string;
    userName?: string;
  }>,
) {
  if (!data.price || data.price <= 0) {
    throw new Error('Bid price must be greater than 0.');
  }
  const { name, descriptions, stocks, price } = data;
  const collection = await prisma.collection.update({
    where: { id },
    data: { name, descriptions, stocks, price },
  });
  revalidatePath('/');
  return collection;
}

export async function deleteCollection(id: string) {
  await prisma.$transaction([
    prisma.bid.deleteMany({ where: { collectionId: id } }),
    prisma.collection.delete({ where: { id } }),
  ]);
  revalidatePath('/');
}
