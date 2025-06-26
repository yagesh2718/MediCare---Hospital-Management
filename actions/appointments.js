"use server";

import { prisma as db } from "@/lib/prisma";
import { authGuard } from "@/lib/authGuard";
import { revalidatePath } from "next/cache";
import { Vonage } from "@vonage/server-sdk";
import { addDays, addMinutes, format, isBefore, endOfDay } from "date-fns";
import { deductCreditsForAppointment } from "@/actions/credits";
import { Auth } from "@vonage/auth";

// --- Vonage setup ---
const credentials = new Auth({
  applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY,
});
const vonage = new Vonage(credentials);

// --- Book appointment ---
export async function bookAppointment(formData) {
  const { authorized, dbUser: patient } = await authGuard("PATIENT");
  if (!authorized) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const startTime = new Date(formData.get("startTime"));
  const endTime = new Date(formData.get("endTime"));
  const patientDescription = formData.get("description") || null;

  if (!doctorId || !startTime || !endTime) {
    throw new Error("Doctor, start time, and end time are required");
  }

  const doctor = await db.user.findUnique({
    where: { id: doctorId, role: "DOCTOR", verificationStatus: "VERIFIED" },
  });

  if (!doctor) throw new Error("Doctor not found or not verified");

  // Ensure time slot is free
  const conflict = await db.appointment.findFirst({
    where: {
      doctorId,
      status: "SCHEDULED",
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        { startTime: { gte: startTime }, endTime: { lte: endTime } },
      ],
    },
  });
  if (conflict) throw new Error("This time slot is already booked");

  // Create video session
  const session = await vonage.video.createSession({ mediaMode: "routed" });
  const sessionId = session.sessionId;

  // Deduct credits
  const { success, error } = await deductCreditsForAppointment(doctor.id);
  if (!success) throw new Error(error || "Credit deduction failed");

  const appointment = await db.appointment.create({
    data: {
      patientId: patient.id,
      doctorId,
      startTime,
      endTime,
      status: "SCHEDULED",
      patientDescription,
      videoSessionId: sessionId,
    },
  });

  revalidatePath("/appointments");
  return { success: true, appointment };
}

export async function generateVideoToken(formData) {
  const { authorized, dbUser } = await authGuard();
  if (!authorized) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId");
  if (!appointmentId) throw new Error("Appointment ID required");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) throw new Error("Appointment not found");
  if (
    appointment.doctorId !== dbUser.id &&
    appointment.patientId !== dbUser.id
  ) {
    throw new Error("Access denied");
  }

  const now = new Date();
  const apptStart = new Date(appointment.startTime);
  const apptEnd = new Date(appointment.endTime);

  if ((apptStart - now) / 1000 / 60 > 30) {
    throw new Error("Token can only be generated 30 minutes before appointment");
  }

  const expireTime = Math.floor(apptEnd.getTime() / 1000) + 3600;

  const connectionData = JSON.stringify({
    name: dbUser.name,
    role: dbUser.role,
    userId: dbUser.id,
  });

  const token = vonage.video.generateClientToken(appointment.videoSessionId, {
    role: "publisher",
    expireTime,
    data: connectionData,
  });

  await db.appointment.update({
    where: { id: appointmentId },
    data: { videoSessionToken: token },
  });

  return { success: true, token, videoSessionId: appointment.videoSessionId };
}

export async function getDoctorById(doctorId) {
  const doctor = await db.user.findUnique({
    where: {
      id: doctorId,
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
    },
  });

  if (!doctor) throw new Error("Doctor not found");
  return { doctor };
}

export async function getAvailableTimeSlots(doctorId) {
  const doctor = await db.user.findUnique({
    where: {
      id: doctorId,
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
    },
  });

  if (!doctor) throw new Error("Doctor not verified");

  const availability = await db.availability.findFirst({
    where: { doctorId, status: "AVAILABLE" },
  });

  if (!availability) throw new Error("No availability found");

  const now = new Date();
  const days = [0, 1, 2, 3].map((d) => addDays(now, d));
  const lastDay = endOfDay(days[3]);

  const existingAppointments = await db.appointment.findMany({
    where: {
      doctorId,
      status: "SCHEDULED",
      startTime: { lte: lastDay },
    },
  });

  const available = {};

  for (const day of days) {
    const dayStr = format(day, "yyyy-MM-dd");
    available[dayStr] = [];

    const start = new Date(availability.startTime);
    const end = new Date(availability.endTime);
    start.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    end.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());

    let current = new Date(start);

    while (
      isBefore(addMinutes(current, 30), end) ||
      +addMinutes(current, 30) === +end
    ) {
      const next = addMinutes(current, 30);

      if (isBefore(current, now)) {
        current = next;
        continue;
      }

      const overlaps = existingAppointments.some((a) => {
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        return (
          (current >= aStart && current < aEnd) ||
          (next > aStart && next <= aEnd) ||
          (current <= aStart && next >= aEnd)
        );
      });

      if (!overlaps) {
        available[dayStr].push({
          startTime: current.toISOString(),
          endTime: next.toISOString(),
          formatted: `${format(current, "h:mm a")} - ${format(next, "h:mm a")}`,
          day: format(current, "EEEE, MMMM d"),
        });
      }

      current = next;
    }
  }

  return Object.entries(available).map(([date, slots]) => ({
    date,
    displayDate:
      slots.length > 0
        ? slots[0].day
        : format(new Date(date), "EEEE, MMMM d"),
    slots,
  }));
}
