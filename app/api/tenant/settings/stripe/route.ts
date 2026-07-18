import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const { tenantId, paymentStrategy, paymentFixedAmount, paymentPercentage, paymentMandatory } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }
  const authError = await requireTenantAdmin(tenantId);
  if (authError) return authError;

    const updated = await prisma.storeSettings.update({
      where: { tenantId },
      data: {
        paymentStrategy,
        paymentFixedAmount: paymentFixedAmount ? parseFloat(paymentFixedAmount) : null,
        paymentPercentage: paymentPercentage ? parseInt(paymentPercentage, 10) : null,
        paymentMandatory: typeof paymentMandatory === "boolean" ? paymentMandatory : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating stripe settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
