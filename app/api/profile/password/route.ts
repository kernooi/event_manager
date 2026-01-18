import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PASSWORD_KEYLEN = 64;
const PASSWORD_SALT_BYTES = 16;

function hashPassword(password: string, salt: Buffer) {
  const hash = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return hash.toString("hex");
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { currentPassword?: string; newPassword?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const currentPassword = payload.currentPassword || "";
  const newPassword = payload.newPassword || "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different" },
      { status: 400 }
    );
  }

  const expectedHash = hashPassword(
    currentPassword,
    Buffer.from(user.passwordSalt, "hex")
  );
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(user.passwordHash, "hex");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const newSalt = crypto.randomBytes(PASSWORD_SALT_BYTES);
  const newHash = hashPassword(newPassword, newSalt);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordSalt: newSalt.toString("hex"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update password" },
      { status: 400 }
    );
  }
}
