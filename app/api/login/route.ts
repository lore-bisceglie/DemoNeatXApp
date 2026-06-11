import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // 🔑 QUI È DOVE IMPOSTI LA PASSWORD
    if (password === "mito2026") {
      const response = NextResponse.json({ success: true });
      response.cookies.set("neatx_auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // Resti loggato per 7 giorni
        path: "/",
      });
      return response;
    }
    
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}