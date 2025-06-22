import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req) {
  const { email, name, image } = await req.json();
  const filePath = path.join(process.cwd(), "lib", "users.json");

  const users = await getAllUsers();
  const index = users.findIndex(u => u.email === email);
  if (index === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  users[index].name = name;
  users[index].image = image;

  await fs.writeFile(filePath, JSON.stringify(users, null, 2));

  return NextResponse.json({ message: "Updated" });
}
