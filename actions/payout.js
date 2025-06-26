"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authGuard } from "@/lib/authGuard";

const CREDIT_VALUE = 100;
const PLATFORM_FEE_PER_CREDIT = 10;
const DOCTOR_EARNINGS_PER_CREDIT = 90;

export async function requestPayout(formData) {
  const { authorized, dbUser: doctor } = await authGuard("DOCTOR");

  if (!authorized) throw new Error("Unauthorized");

  try {
    const paypalEmail = formData.get("paypalEmail");
    if (!paypalEmail) throw new Error("PayPal email is required");

    // Check existing pending payout
    const existingPending = await db.payout.findFirst({
      where: {
        doctorId: doctor.id,
        status: "PROCESSING",
      },
    });

    if (existingPending) {
      throw new Error("You already have a pending payout request.");
    }

    const creditCount = doctor.credits;

    if (creditCount < 1) {
      throw new Error("Minimum 1 credit required for payout");
    }

    const totalAmount = creditCount * CREDIT_VALUE;
    const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
    const netAmount = creditCount * DOCTOR_EARNINGS_PER_CREDIT;

    const payout = await db.payout.create({
      data: {
        doctorId: doctor.id,
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
        paypalEmail: paypalEmail.toString(),
        status: "PROCESSING",
      },
    });

    revalidatePath("/doctor");
    return { success: true, payout };
  } catch (error) {
    console.error("Payout failed:", error);
    throw new Error("Failed to request payout: " + error.message);
  }
}

export async function getDoctorPayouts() {
  const { authorized, dbUser: doctor } = await authGuard("DOCTOR");
  if (!authorized) throw new Error("Unauthorized");

  try {
    const payouts = await db.payout.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts };
  } catch (error) {
    throw new Error("Failed to fetch payouts: " + error.message);
  }
}

export async function getDoctorEarnings() {
  const { authorized, dbUser: doctor } = await authGuard("DOCTOR");
  if (!authorized) throw new Error("Unauthorized");
    console.log("from payout")
  try {
    const completedAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
      },
    });
    console.log("from payout",doctor.id)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (a) => new Date(a.createdAt) >= currentMonth
    );
    
    const totalEarnings = doctor.credits * DOCTOR_EARNINGS_PER_CREDIT;
    const thisMonthEarnings =
      thisMonthAppointments.length * 2 * DOCTOR_EARNINGS_PER_CREDIT;
    console.log("from payout earnings" ,totalEarnings)
    const averageEarningsPerMonth =
      thisMonthEarnings > 0
        ? thisMonthEarnings / Math.max(1, new Date().getMonth() + 1)
        : 0;

    const availableCredits = doctor.credits;
    const availablePayout = availableCredits * DOCTOR_EARNINGS_PER_CREDIT;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
      },
    };
  } catch (error) {
    throw new Error("Failed to fetch doctor earnings: " + error.message);
  }
}
