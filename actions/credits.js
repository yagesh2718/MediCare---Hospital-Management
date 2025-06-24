"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

// Credit logic constants
const PLAN_CREDITS = {
  free_user: 0,
  standard: 10,
  premium: 24,
};

const APPOINTMENT_CREDIT_COST = 2;

/**
 * Allocates credits based on current plan. Called after successful Razorpay payment.
 */
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
    // Create transaction
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
export async function deductCreditsForAppointment(userId, doctorId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });

    if (!user || user.credits < APPOINTMENT_CREDIT_COST) {
      throw new Error("Insufficient credits");
    }

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Deduct from patient
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: APPOINTMENT_CREDIT_COST } },
      });

      // Add to doctor
      await tx.creditTransaction.create({
        data: {
          userId: doctor.id,
          amount: APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      await tx.user.update({
        where: { id: doctor.id },
        data: { credits: { increment: APPOINTMENT_CREDIT_COST } },
      });

      return tx.user.findUnique({ where: { id: user.id } });
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Deduct credits error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deductCreditsForAppointment(doctorId) {
  const { authorized, session, dbUser } = await authGuard("PATIENT");
  if (!authorized || !dbUser) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const doctor = await db.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return { success: false, error: "Invalid doctor" };
    }

    if (dbUser.credits < APPOINTMENT_CREDIT_COST) {
      return { success: false, error: "Insufficient credits" };
    }

    const result = await db.$transaction(async (tx) => {
      // Record deduction from patient
      await tx.creditTransaction.create({
        data: {
          userId: dbUser.id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Record addition to doctor
      await tx.creditTransaction.create({
        data: {
          userId: doctor.id,
          amount: APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Update both balances
      const updatedPatient = await tx.user.update({
        where: { id: dbUser.id },
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

      return updatedPatient;
    });

    return { success: true, user: result };
  } catch (error) {
    console.error("Error in credit deduction:", error);
    return { success: false, error: error.message };
  }
}