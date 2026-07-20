import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const posts = await prisma.socialPost.findMany({
      where: { tenantId: tenant.id },
      orderBy: { scheduledFor: 'asc' }
    });

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error("GET SocialPosts Error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, imageUrl, caption, scheduledFor, platform } = body;

    if (!slug || !caption) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const post = await prisma.socialPost.create({
      data: {
        tenantId: tenant.id,
        imageUrl,
        caption,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        platform: platform || "INSTAGRAM",
        status: "SCHEDULED"
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    console.error("POST SocialPost Error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const postId = searchParams.get("postId");

    if (!slug || !postId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    await prisma.socialPost.deleteMany({
      where: {
        id: postId,
        tenantId: tenant.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE SocialPost Error:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
