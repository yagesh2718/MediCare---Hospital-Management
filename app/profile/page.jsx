import { authGuard } from "@/lib/authGuard";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { authorized, session } = await authGuard();
  if (!authorized) redirect("/login");

  return <div className="py-50">Welcome {session.user.name}</div>;
}