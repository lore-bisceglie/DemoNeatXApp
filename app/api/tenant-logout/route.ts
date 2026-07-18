import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: "Tenant non valido" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  const expiredCookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  };
  response.cookies.set(`admin_auth_${slug}`, "", expiredCookie);
  response.cookies.set("neatx_tenant_slug", "", expiredCookie);
  return response;
}
