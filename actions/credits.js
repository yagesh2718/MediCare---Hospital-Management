"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { authGuard } from "@/lib/authGuard";

// Credit logic constants
const PLAN_CREDITS = {
  free_user: 0,
  standard: 10,
  premium: 24,
};

const APPOINTMENT_CREDIT_COST = 2;


export async function allocateCreditsAfterPurchase(packageId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "PATIENT") return null;

  const creditsToAdd = PLAN_CREDITS[packageId];
  if (!creditsToAdd) return null;

  const result = await prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        userId: user.id,
        amount: creditsToAdd,
        type: "CREDIT_PURCHASE",
        packageId,
      },
    });

    // Add to user's balance
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        credits: { increment: creditsToAdd },
      },
    });

    revalidatePath("/doctors");
    revalidatePath("/appointments");

    return updatedUser;
  });

  return result;
}

/**
 * Deduct credits when booking appointment
 */
export async function deductCreditsForAppointment(doctorId) {
  const { authorized, dbUser: patient } = await authGuard("PATIENT");
  if (!authorized) throw new Error("Unauthorized");

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) throw new Error("Doctor not found");

  if (patient.credits < APPOINTMENT_CREDIT_COST) {
    throw new Error("Insufficient credits to book an appointment");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        userId: patient.id,
        amount: -APPOINTMENT_CREDIT_COST,
        type: "APPOINTMENT_DEDUCTION",
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: doctor.id,
        amount: APPOINTMENT_CREDIT_COST,
        type: "APPOINTMENT_DEDUCTION",
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: patient.id },
      data: {
        credits: {
          decrement: APPOINTMENT_CREDIT_COST,
        },
      },
    });

    await tx.user.update({
      where: { id: doctor.id },
      data: {
        credits: {
          increment: APPOINTMENT_CREDIT_COST,
        },
      },
    });
    revalidatePath("/")
    return updatedUser;
  });

  return { success: true, user: result };
}
