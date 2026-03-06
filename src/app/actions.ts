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
  }>,
) {
  const collection = await prisma.collection.update({ where: { id }, data });
  revalidatePath('/');
  return collection;
}

export async function deleteCollection(id: string) {
  // We must delete associated bids first or use "OnCascade Delete" in Prisma schema
  await prisma.bid.deleteMany({ where: { collectionId: id } });
  await prisma.collection.delete({ where: { id } });
  revalidatePath('/');
}

export async function getBids(collectionId: string) {
  return await prisma.bid.findMany({
    where: { collectionId },
    include: { user: true },
    orderBy: { price: 'desc' },
  });
}

export async function createBid(data: {
  collectionId: string;
  userId: string;
  price: number;
  userName?: string;
}) {

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

  const bid = await prisma.bid.create({
    data: {
      collectionId: data.collectionId,
      userId: data.userId,
      price: data.price,
      status: 'pending',
    },
  });
  revalidatePath('/');
  return bid;
}

export async function updateBid(id: string, price: number) {
  const bid = await prisma.bid.update({
    where: { id },
    data: { price },
  });
  revalidatePath('/');
  return bid;
}

export async function deleteBid(id: string) {
  await prisma.bid.delete({ where: { id } });
  revalidatePath('/');
}

// Accept bid logic
export async function acceptBid(bidId: string, collectionId: string) {
  try {
    await prisma.$transaction([
      // 1. Mark the chosen bid as accepted
      prisma.bid.update({
        where: { id: bidId },
        data: { status: 'accepted' },
      }),
      // 2. Reject all other bids for this specific collection
      prisma.bid.updateMany({
        where: {
          collectionId,
          id: { not: bidId },
        },
        data: { status: 'rejected' },
      }),
    ]);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to accept bid' };
  }
}
