import { prisma } from "./generated/prisma";

export async function findUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(data) {
  return await prisma.user.create({
    data,
  });
}
