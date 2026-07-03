const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

// I want to ensure `staffList` is defined ONLY ONCE (at line 48), and we don't redefine it.
// The file has:
// const staffList = await prisma.staff.findMany({ where: { tenantId } });
// at line 48.
// We removed it from line 128. That's fine.

// Now I need to fix the duplicate analytics block inserted by the bad replace_file_content!
// Let's find the double "const todayTotalRevenue = todayAppointmentsList.reduce"

const badBlockRegex = /const todayTotalRevenue = todayAppointmentsList\.reduce\([\s\S]*?const todayTotalRevenue = todayAppointmentsList\.reduce\([\s\S]*?0\s*\);/g;

// Instead of regex, I will just clean up everything between "const waitlistData = await prisma.waitlist.findMany({"
// and "const chartData = past14Days.map((date) => {"

const fixRegex = /const waitlistData = await prisma\.waitlist\.findMany\([\s\S]*?const chartData = past14Days\.map\(\(date\) => \{/;

const cleanBlock = `const waitlistData = await prisma.waitlist.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });

  const currentMonthPrefix = todayItaly.substring(0, 7);
  const monthlyAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        startsWith: currentMonthPrefix,
      },
      tenantId,
    },
    include: {
      service: true,
    },
  });

  const validMonthly = monthlyAppointments.filter(
    (app) =>
      !app.customerName.includes("PAUSA") &&
      !app.customerName.includes("FERIE")
  );

  const estimatedRevenue = validMonthly.reduce(
    (sum, app) => sum + (app.service?.price || 0),
    0
  );

  const todayAppointmentsList = radarAppointments.filter(
    (a) =>
      a.date === todayItaly &&
      !a.customerName.includes("PAUSA") &&
      !a.customerName.includes("FERIE")
  );

  const todayPaid = todayAppointmentsList.filter((a) => a.isPaid).length;

  const todayTotalRevenue = todayAppointmentsList.reduce(
    (sum, app) => sum + (app.service?.price || 0),
    0
  );

  const chartData = past14Days.map((date) => {`;

content = content.replace(fixRegex, cleanBlock);
fs.writeFileSync(p, content);
console.log("Analytics block cleaned up!");
