import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Checks session and optionally role.
 * @param {string|null} requiredRole - e.g. "instructor", or null if only auth is needed
 * @returns {Object} { authorized: Boolean, session: Object|null }
 */
export async function authGuard(requiredRole = null) {
  const session = await getServerSession(authOptions);

  if (!session) return { authorized: false, session: null };

  if (requiredRole && session.user.role !== requiredRole) {
    return { authorized: false, session };
  }

  return { authorized: true, session };
}
