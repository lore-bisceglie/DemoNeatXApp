const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split("T")[0];

  const allAppointments = await prisma.appointment.findMany({
    where: {
      tenantId: DEMO_TENANT_ID,
      date: { gte: threeMonthsAgoStr },
    },
    orderBy: { date: "asc" },
  });

  const appointments = allAppointments.filter(
    (a) => !a.customerName.includes("PAUSA") && !a.customerName.includes("FERIE")
  );

  console.log("Found appointments:", appointments.length);
  if(appointments.length > 0) {
    console.log("First appointment:", appointments[0].date, appointments[0].customerName);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
