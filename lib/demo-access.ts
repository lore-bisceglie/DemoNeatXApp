import { NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/auth";
import { DEMO_TENANT_ID } from "@/lib/demoService";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

export async function requireTenantAdminOrDemo(
  request: Request,
  tenantId: string | null | undefined,
  action: string,
  limit = 60,
) {
  if (tenantId !== DEMO_TENANT_ID) {
    return requireTenantAdmin(tenantId);
  }

  const rate = await checkRequestRateLimit(
    request,
    `demo-dashboard:${action}`,
    limit,
    60 * 60,
  );

  if (!rate.success) {
    return NextResponse.json(
      { error: "Troppe azioni sulla demo. Riprova piu tardi." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  return null;
}
