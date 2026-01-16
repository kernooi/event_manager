import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PASSWORD_KEYLEN = 64;
const PASSWORD_SALT_BYTES = 16;

function hashPassword(password: string, salt: Buffer) {
  const hash = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return hash.toString("hex");
}

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = request.headers.get("x-admin-secret");

  if (!adminSecret || providedSecret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { email?: string; password?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and password (min 8 chars) are required" },
      { status: 400 }
    );
  }

  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES);
  const passwordHash = hashPassword(password, salt);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        passwordSalt: salt.toString("hex"),
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create user" },
      { status: 400 }
    );
  }
}
