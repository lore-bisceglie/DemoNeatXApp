import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const { slug, email, password } = await req.json();

    if (!slug || !password) {
      return NextResponse.json({ error: "Credenziali mancanti." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant?.adminPassword) {
      return NextResponse.json({ error: "Account non trovato." }, { status: 404 });
    }

    const emailMatches =
      !tenant.ownerEmail ||
      !email ||
      tenant.ownerEmail.toLowerCase() === String(email).trim().toLowerCase();

    const passwordMatches = tenant.ownerPasswordHash
      ? verifyPassword(password, tenant.ownerPasswordHash)
      : password === tenant.adminPassword;

    if (!emailMatches || !passwordMatches) {
      return NextResponse.json({ error: "Email o password non valide." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(`admin_auth_${tenant.slug}`, tenant.adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Errore tenant-login:", error);
    return NextResponse.json({ error: "Errore server." }, { status: 500 });
  }
}
