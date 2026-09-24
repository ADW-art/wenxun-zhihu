import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireSession();
  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError();
  }
  return session;
}
