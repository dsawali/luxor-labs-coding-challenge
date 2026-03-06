"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getBids(collectionId: string) {
  return await prisma.bid.findMany({
    where: { collectionId },
    include: { user: true },
    orderBy: { price: "desc" },
  });
}

export async function createBid(data: {
  collectionId: string;
  userId: string;
  price: number;
  userName?: string;
}) {
  if (!data.price || data.price <= 0) {
    throw new Error('Bid price must be greater than 0.');
  }

  const userName = data.userName || "Mock User";
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
      status: "pending",
    },
  });
  revalidatePath("/");
  return bid;
}

export async function updateBid(id: string, price: number) {
  if (!price || price <= 0) {
    throw new Error('Bid price must be greater than 0.');
  }

  const bid = await prisma.bid.update({
    where: { id },
    data: { price },
  });
  revalidatePath("/");
  return bid;
}

export async function deleteBid(id: string) {
  await prisma.bid.delete({ where: { id } });
  revalidatePath("/");
}

export async function acceptBid(bidId: string, collectionId: string) {
  try {
    await prisma.$transaction([
      // Mark the chosen bid as accepted
      prisma.bid.update({
        where: { id: bidId },
        data: { status: "accepted" },
      }),
      // Reject all other bids for this specific collection
      prisma.bid.updateMany({
        where: {
          collectionId,
          id: { not: bidId },
        },
        data: { status: "rejected" },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to accept bid" };
  }
}
