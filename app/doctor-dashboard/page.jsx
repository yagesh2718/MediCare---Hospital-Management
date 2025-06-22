import { authGuard } from "@/lib/authGuard";
import { redirect } from "next/navigation";

export default async function InstructorDashboard() {
  const { authorized, session } = await authGuard("doctor");
  if (!authorized) redirect("/unauthorized");

  return <div className="py-42">Instructor content for {session.user.name}</div>;
}
