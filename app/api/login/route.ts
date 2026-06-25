import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    // 🔒 LEGGE ID E PASSWORD DIRETTAMENTE DAL FILE .env!
    const validUser = process.env.ADMIN_USER;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (username === validUser && password === validPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("neatx_auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // Resti loggato per 7 giorni senza dover rimettere la password
        path: "/",
      });
      return response;
    }
    
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}