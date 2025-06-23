import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, name, image } = await req.json();

    if (!email || (!name && !image)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { email },
      data: {
        name,
        imageUrl: image,
      },
    });

    return NextResponse.json({ message: "Profile updated", updated });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
