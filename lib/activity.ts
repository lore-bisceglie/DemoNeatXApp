import { prisma } from "@/lib/prisma";

type LogInput = {
  action: string;
  actor?: string;
  message: string;
  appointmentId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  date?: string | null;
  time?: string | null;
  metadata?: unknown;
  tenantId?: string;
};

export async function logActivity(input: LogInput) {
  if (!input.tenantId) {
    console.error("Errore log attività: tenantId mancante.");
    return;
  }
  
  try {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        actor: input.actor || "system",
        message: input.message,
        appointmentId: input.appointmentId || null,
        customerName: input.customerName || null,
        customerPhone: input.customerPhone || null,
        date: input.date || null,
        time: input.time || null,
        metadata:
          input.metadata === undefined ? null : JSON.stringify(input.metadata),
        tenantId: input.tenantId,
      },
    });
  } catch (error) {
    console.error("Errore log attività:", error);
  }
}
