import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function authGuard(requiredRole = null) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return { authorized: false, session: null, dbUser: null };

  const dbUser = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    credits: true,
  },
});

  if (!dbUser) return { authorized: false, session, dbUser: null };

  if (requiredRole && dbUser.role !== requiredRole.toUpperCase()) {
    return { authorized: false, session, dbUser };
  }

  return { authorized: true, session, dbUser };
}
