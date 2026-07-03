const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

// The corrupted block starts near "const timeToMinutes = (value: string) => {" around line 115
// and ends near "const maxConcurrent = columns.length;" around line 200.

const startRegex = /const urlDate = \(await searchParams\)\?\.date;\s*const targetDate = urlDate \|\| todayItaly;/;
const endRegex = /const columns = staffList\.length > 0 \? staffList\.map\(s => s\.id\) : \["unassigned"\];/;

const matchStart = content.match(startRegex);
const matchEnd = content.match(endRegex);

if (matchStart && matchEnd) {
  const startIndex = matchStart.index + matchStart[0].length;
  const endIndex = matchEnd.index;

  const newBlock = `

  const timeToMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (value: number) => {
    const hours = Math.floor(value / 60).toString().padStart(2, "0");
    const minutes = (value % 60).toString().padStart(2, "0");
    return \`\${hours}:\${minutes}\`;
  };

  const weekOffset = parseInt((await searchParams).weekOffset || "0", 10);

  const staffList = await prisma.staff.findMany({ where: { tenantId } });
  const isMultiStaff = staffList.length > 1;

  let weekDays: { date: string, label: string }[] = [];
  const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

  if (isMultiStaff) {
    const d = new Date(targetDate);
    const label = \`\${dayNames[d.getDay()]} \${d.getDate().toString().padStart(2, '0')}/\${(d.getMonth()+1).toString().padStart(2, '0')}\`;
    weekDays = [{ date: targetDate, label }];
  } else {
    // Single staff fallback
    const refDate = new Date(targetDate);
    const dayOfWeek = refDate.getDay();
    const diffToTue = dayOfWeek >= 2 ? 2 - dayOfWeek : -5;
    const tuesday = new Date(refDate);
    tuesday.setDate(refDate.getDate() + diffToTue);

    weekDays = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(tuesday);
      d.setDate(tuesday.getDate() + i);

      const iso = d.toISOString().split("T")[0];
      const [, m, dayStr] = iso.split("-");
      const label = \`\${dayNames[d.getDay()].substring(0, 3)} \${dayStr}/\${m}\`;

      return { date: iso, label };
    });
  }

  const past14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (i + 1));
    return d.toISOString().split("T")[0];
  });

  const weekDatesArray = Array.from(new Set([...weekDays.map(w => w.date), ...past14Days]));

  const allSlots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      allSlots.push(\`\${h.toString().padStart(2, "0")}:\${m.toString().padStart(2, "0")}\`);
    }
  }

  const rawAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: todayItaly },
      tenantId,
    },
    orderBy: [ { date: "asc" }, { time: "asc" } ],
    include: { service: true },
  });

  `;

  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(p, content);
  console.log("Successfully rebuilt the corrupted block!");
} else {
  console.log("Regex did not match.");
  console.log("Start:", !!matchStart);
  console.log("End:", !!matchEnd);
}
