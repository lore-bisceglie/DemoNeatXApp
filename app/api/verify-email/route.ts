import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const slug = searchParams.get("slug");

    if (!token || !slug) {
      return new Response(
        `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#ef4444">Link non valido</h1><p>Mancano i parametri di verifica.</p></div></body></html>`,
        { status: 400, headers: { "content-type": "text/html" } }
      );
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, emailVerifyToken: token },
    });

    if (!tenant) {
      return new Response(
        `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#ef4444">Link non valido o scaduto</h1><p>Il link di verifica non è più valido. Contatta il supporto.</p></div></body></html>`,
        { status: 400, headers: { "content-type": "text/html" } }
      );
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    return new Response(
      `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div style="max-width:400px"><h1 style="color:#10b981">Email verificata ✅</h1><p>Ora puoi accedere alla dashboard.</p><a href="/t/${slug}/admin" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#00b4ff;color:white;border-radius:12px;text-decoration:none;font-weight:bold">Vai alla dashboard</a></div></body></html>`,
      { headers: { "content-type": "text/html" } }
    );
  } catch (error) {
    console.error("Errore verifica email:", error);
    return new Response(
      `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#ef4444">Errore</h1><p>Riprova più tardi.</p></div></body></html>`,
      { status: 500, headers: { "content-type": "text/html" } }
    );
  }
}
