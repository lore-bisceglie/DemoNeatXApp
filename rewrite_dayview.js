const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Aggiungere l'import del DayNavigator in cima
if (!content.includes('import DayNavigator')) {
  content = content.replace(
    'import ResetDemoButton from "../../../dashboard/ResetDemoButton";',
    'import ResetDemoButton from "../../../dashboard/ResetDemoButton";\nimport DayNavigator from "../../../dashboard/DayNavigator";'
  );
}

// 2. Modificare il parse della data iniziale per supportare searchParams.date
// Cerchiamo: "const dateFormatter = new Intl.DateTimeFormat("it-IT", {"
// che inizializzava todayItaly ecc.
// Wait, the file has:
// const now = new Date();
// ...
// const todayItaly = ...

const oldDateBlockRegex = /const now = new Date\(\);[\s\S]*?const currentTotalMinutes = currentHours \* 60 \+ currentMinutes;/;

const newDateBlock = `
  const now = new Date();
  
  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dateFormatter.formatToParts(now);
  const todayItaly = \`\${parts.find((p) => p.type === "year")?.value}-\${
    parts.find((p) => p.type === "month")?.value
  }-\${parts.find((p) => p.type === "day")?.value}\`;

  const timeFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const currentTimeItaly = timeFormatter.format(now);
  const [currentHours, currentMinutes] = currentTimeItaly
    .split(":")
    .map(Number);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const urlDate = (await searchParams)?.date;
  const targetDate = urlDate || todayItaly;
`;

content = content.replace(oldDateBlockRegex, newDateBlock);


// 3. Riscrivere la logica weekDays e weekDatesArray per usare targetDate e isMultiStaff
const oldWeekDaysRegex = /const refDate = new Date\(todayItaly\);[\s\S]*?const weekDatesArray = weekDays\.map\(\(w\) => w\.date\);/;

const newWeekDaysBlock = `
  const isMultiStaff = staffList.length > 1;

  let weekDays: { date: string, label: string }[] = [];
  const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

  if (isMultiStaff) {
    const d = new Date(targetDate);
    const label = \`\${dayNames[d.getDay()]} \${d.getDate().toString().padStart(2, '0')}/\${(d.getMonth()+1).toString().padStart(2, '0')}\`;
    weekDays = [{ date: targetDate, label }];
  } else {
    // Single staff fallback (settimana classica a partire da targetDate)
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
`;

// Wait, I need to fetch staffList BEFORE newWeekDaysBlock, but staffList is currently fetched right before radarMap at line 205.
// I'll move staffList up!
content = content.replace(
  'const staffList = await prisma.staff.findMany({ where: { tenantId } });',
  '' // I will insert it earlier
);

const insertionPoint = '  const tenantServices = tenant.services;';
content = content.replace(
  insertionPoint,
  insertionPoint + '\n\n  const staffList = await prisma.staff.findMany({ where: { tenantId } });\n  const columns = staffList.length > 0 ? staffList.map(s => s.id) : ["unassigned"];\n  const maxConcurrent = columns.length;\n'
);

content = content.replace(
  '  const columns = staffList.length > 0 ? staffList.map(s => s.id) : ["unassigned"];',
  '' // Already inserted above
);
content = content.replace(
  '  const maxConcurrent = columns.length;',
  '' // Already inserted above
);


// Find where to replace the old weekDays logic
// Let's replace the whole block from "const dayNames = [" to "weekDays.map((w) => w.date);"
content = content.replace(
  /const dayNames = \["Domenica"[\s\S]*?const weekDatesArray = weekDays\.map\(\(w\) => w\.date\);/,
  newWeekDaysBlock
);


// 4. Iniettare <DayNavigator /> appena dentro SwipeableAgenda
content = content.replace(
  '<SwipeableAgenda>',
  '<SwipeableAgenda>\n          <DayNavigator currentDate={targetDate} slug={slug} isMultiStaff={isMultiStaff} />'
);

fs.writeFileSync(p, content);
console.log("DayView premium logic updated!");
