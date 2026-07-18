import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ services });
}
