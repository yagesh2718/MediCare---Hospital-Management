import { prisma as db } from "@/lib/prisma";
import { authGuard } from "@/lib/authGuard";


export async function getPatientAppointments() {
  const { authorized, dbUser } = await authGuard("PATIENT");

  if (!authorized) {
    throw new Error("Unauthorized");
  }

  try {
    const appointments = await db.appointment.findMany({
      where: {
        patientId: dbUser.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
