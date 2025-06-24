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


 export async function cancelAppointment(formData) {
  const { authorized, dbUser: user } = await authGuard();

  if (!authorized) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId");
  if (!appointmentId) throw new Error("Appointment ID is required");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, doctor: true },
  });

  if (!appointment) throw new Error("Appointment not found");

  if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
    throw new Error("You are not authorized to cancel this appointment");
  }

  await db.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    await tx.creditTransaction.createMany({
      data: [
        {
          userId: appointment.patientId,
          amount: 2,
          type: "APPOINTMENT_DEDUCTION",
        },
        {
          userId: appointment.doctorId,
          amount: -2,
          type: "APPOINTMENT_DEDUCTION",
        },
      ],
    });

    await tx.user.update({
      where: { id: appointment.patientId },
      data: { credits: { increment: 2 } },
    });

    await tx.user.update({
      where: { id: appointment.doctorId },
      data: { credits: { decrement: 2 } },
    });
  });

  if (user.role === "DOCTOR") {
    revalidatePath("/doctor");
  } else if (user.role === "PATIENT") {
    revalidatePath("/appointments");
  }

  return { success: true };
}


export async function addAppointmentNotes(formData) {
  const { authorized, dbUser: doctor } = await authGuard("DOCTOR");

  if (!authorized) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId");
  const notes = formData.get("notes");

  if (!appointmentId || !notes) {
    throw new Error("Appointment ID and notes are required");
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId, doctorId: doctor.id },
  });

  if (!appointment) throw new Error("Appointment not found");

  const updatedAppointment = await db.appointment.update({
    where: { id: appointmentId },
    data: { notes },
  });

  revalidatePath("/doctor");
  return { success: true, appointment: updatedAppointment };
}


export async function markAppointmentCompleted(formData) {
  const { authorized, dbUser: doctor } = await authGuard("DOCTOR");

  if (!authorized) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId");

  if (!appointmentId) throw new Error("Appointment ID is required");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId, doctorId: doctor.id },
    include: { patient: true },
  });

  if (!appointment) throw new Error("Appointment not found");

  if (appointment.status !== "SCHEDULED") {
    throw new Error("Only scheduled appointments can be marked as completed");
  }

  const now = new Date();
  if (now < new Date(appointment.endTime)) {
    throw new Error("Cannot mark as completed before end time");
  }

  const updatedAppointment = await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/doctor");
  return { success: true, appointment: updatedAppointment };
}
