"use server";

import { prisma as db } from "@/lib/prisma";
import { authGuard } from "@/lib/authGuard";
import { revalidatePath } from "next/cache";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { authorized, dbUser } = await authGuard(); // ✅ Use NextAuth-based guard

  if (!authorized || !dbUser) {
    throw new Error("Unauthorized");
  }

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    // PATIENT: only update role
    if (role === "PATIENT") {
      await db.user.update({
        where: { id: dbUser.id },
        data: { role: "PATIENT" },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    // DOCTOR: requires more info
    const specialty = formData.get("specialty");
    const experience = parseInt(formData.get("experience"), 10);
    const credentialUrl = formData.get("credentialUrl");
    const description = formData.get("description");

    if (!specialty || !experience || !credentialUrl || !description) {
      throw new Error("All fields are required for doctor onboarding");
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        role: "DOCTOR",
        specialty,
        experience,
        credentialUrl,
        description,
        verificationStatus: "PENDING",
      },
    });

    revalidatePath("/");
    return { success: true, redirect: "/doctor/verification" };
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Update failed: ${error.message}`);
  }
}

export async function getCurrentUser() {
  const { authorized, dbUser } = await authGuard();

  if (!authorized || !dbUser) {
    return null;
  }

  try {
    const fullUser = await db.user.findUnique({
      where: { id: dbUser.id },
    });

    return fullUser;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}
