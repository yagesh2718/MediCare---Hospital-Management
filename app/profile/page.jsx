import { authGuard } from "@/lib/authGuard"; // or wherever you placed it
import { redirect } from "next/navigation";

export default async function Page() {
  const { authorized, session } = await authGuard();

  if (!authorized) {
    
   
   redirect("/login");
  }

  return <div className="py-48">Welcome, {session.user.name}</div>;
}
