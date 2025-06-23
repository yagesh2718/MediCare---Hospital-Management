import { authGuard } from "@/lib/authGuard";
import { redirect } from "next/navigation";

export default async function DoctorDashboard() {
  const { authorized, dbUser } = await authGuard("DOCTOR");

  if (!authorized) {
    redirect("/unauthorized"); // Or show a 403 page
  }

  return <div>Doctor Dashboard for {dbUser.name}</div>;
}
