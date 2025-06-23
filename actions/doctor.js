"use server";

import { prisma as db } from "@/lib/prisma";
import { authGuard } from "@/lib/authGuard";
import { revalidatePath } from "next/cache";

/**
 * Set doctor's availability slots
 */
export async function setAvailabilitySlots(formData) {
  const { authorized, dbUser } = await authGuard("DOCTOR");
  if (!authorized || !dbUser) {
    throw new Error("Unauthorized");
  }

  try {
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    if (new Date(startTime) >= new Date(endTime)) {
      throw new Error("Start time must be before end time");
    }

    // Get existing slots
    const existingSlots = await db.availability.findMany({
      where: {
        doctorId: dbUser.id,
      },
    });

    // Delete slots without appointments
    const deletableSlotIds = existingSlots
      .filter((slot) => !slot.appointment)
      .map((slot) => slot.id);

    if (deletableSlotIds.length > 0) {
      await db.availability.deleteMany({
        where: {
          id: { in: deletableSlotIds },
        },
      });
    }

    // Create new slot
    const newSlot = await db.availability.create({
      data: {
        doctorId: dbUser.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "AVAILABLE",
      },
    });

    revalidatePath("/doctor");
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Set availability error:", error);
    throw new Error("Failed to set availability: " + error.message);
  }
}

/**
 * Get doctor's availability
 */
export async function getDoctorAvailability() {
  const { authorized, dbUser } = await authGuard("DOCTOR");
  if (!authorized || !dbUser) throw new Error("Unauthorized");

  try {
    const slots = await db.availability.findMany({
      where: { doctorId: dbUser.id },
      orderBy: { startTime: "asc" },
    });

    return { slots };
  } catch (error) {
    throw new Error("Failed to fetch slots: " + error.message);
  }
}

/**
 * Get doctor's upcoming appointments
 */
export async function getDoctorAppointments() {
//   const { authorized, dbUser } = await authGuard("DOCTOR");
//   if (!authorized || !dbUser) throw new Error("Unauthorized");

//   try {
//     const appointments = await db.appointment.findMany({
//       where: {
//         doctorId: dbUser.id,
//         status: { in: ["SCHEDULED"] },
//       },
//       include: {
//         patient: true,
//       },
//       orderBy: {
//         startTime: "asc",
//       },
//     });

//     return { appointments };
//   } catch (error) {
//     throw new Error("Failed to fetch appointments: " + error.message);
//   }
return []
 }
