import { NextResponse } from "next/server";
import { addUser, findUserByEmail } from "@/lib/auth";

export async function POST(req) {
  const { name, email, password, role } = await req.json();
  const existingUser = await findUserByEmail(email);
  if (existingUser) return NextResponse.json({ error: "User exists" }, { status: 400 });
  await addUser({ name, email, password, role });
  return NextResponse.json({ message: "User created" }, { status: 200 });
}
