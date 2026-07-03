const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let lines = fs.readFileSync(p, 'utf8').split('\n');

const newLines = [];
let i = 0;

while (i < lines.length) {
  let line = lines[i];

  if (line.includes('const maxConcurrent = storeSettings?.maxConcurrentAppointments || 1;')) {
    // Skip this line and replace it with Staff logic
    newLines.push('  const staffList = await prisma.staff.findMany({ where: { tenantId } });');
    newLines.push('  const columns = staffList.length > 0 ? staffList.map(s => s.id) : ["unassigned"];');
    newLines.push('  const maxConcurrent = columns.length;');
    i++;
    continue;
  }
  
  if (line.includes('const radarMap: Record<string, Record<number, Record<string, any>>> = {};')) {
    newLines.push('  const radarMap: Record<string, Record<string, Record<string, any>>> = {};');
    i++;
    continue;
  }

  // 2. Map init logic
  if (line.includes('for (let c = 0; c < maxConcurrent; c++) {')) {
    newLines.push('    for (const colId of columns) {');
    newLines.push('      radarMap[d][colId] = {};');
    newLines.push('    }');
    i += 3;
    continue;
  }

  // 3. radarAppointments parsing logic
  if (line.includes('let targetCol = 0;')) {
    // We replace the column assignment logic
    newLines.push(`      // Assegna la colonna in base allo staffId reale dell'appuntamento`);
    newLines.push(`      const targetCol = app.staffId || "unassigned";`);
    
    // Skip the old `for` loop that searched for a free column
    while (i < lines.length && !lines[i].includes('const actualTime = app.time === "ALL_DAY" ? "09:00" : app.time;')) {
      i++;
    }
    continue;
  }

  // 4. Gap Reports logic
  if (line.includes('for (let c = 0; c < maxConcurrent; c++) {') && lines[i+1]?.includes('!radarMap[dayInfo.date]?.[c]?.[slot]')) {
    newLines.push('        for (const colId of columns) {');
    newLines.push('          if (!radarMap[dayInfo.date]?.[colId]?.[slot]) {');
    i += 2;
    continue;
  }

  newLines.push(line);
  i++;
}

fs.writeFileSync(p, newLines.join('\n'));

// Now replace the weekDays cell mapping using regex for JUST THAT PART
let finalContent = fs.readFileSync(p, 'utf8');

// The weekDays map cell mapping loop is using: for (let c = 0; c < maxConcurrent; c++) {
// We replace it with: for (const colId of columns) {
finalContent = finalContent.replace(
  /for \(let c = 0; c < maxConcurrent; c\+\+\) \{/g,
  'for (const colId of columns) {'
);

finalContent = finalContent.replace(
  /const appt = radarMap\[d\.date\]\?\.\[c\]\?\.\[slot\];/g,
  'const appt = radarMap[d.date]?.[colId]?.[slot];'
);

finalContent = finalContent.replace(
  /const cellKey = `\$\{d\.date\}-\$\{slot\}-\$\{c\}`;/g,
  'const cellKey = `${d.date}-${slot}-${colId}`;'
);

// We also need to add Staff Names in the headers if staffList > 0.
// Look for the Day Header render block.
const dayHeaderRegex = /<div\s*key=\{d\.date\}\s*style=\{\{ gridColumn: `span \$\{maxConcurrent\}` \}\}\s*className=\{`text-center py-2 mb-2 rounded-xl border capitalize transition-colors \$\{\s*isToday\s*\?\s*"bg-cyan-500\/10 text-\[#00b4ff\] font-extrabold border-\[#00b4ff\]\/40 shadow-\[0_0_15px_rgba\(0,180,255,0\.15\)\]"\s*:\s*"bg-\[#131c31\] text-white font-bold border-\[#1e2b4a\]"\s*\}\`\}\s*>\s*\{d\.label\}\s*<\/div>/g;

const newDayHeader = `<div key={d.date} style={{ gridColumn: \`span \${maxConcurrent}\` }} className="flex flex-col gap-2 mb-2">
                      <div className={\`text-center py-2 rounded-xl border capitalize transition-colors \${
                        isToday 
                          ? "bg-cyan-500/10 text-[#00b4ff] font-extrabold border-[#00b4ff]/40 shadow-[0_0_15px_rgba(0,180,255,0.15)]" 
                          : "bg-[#131c31] text-white font-bold border-[#1e2b4a]"
                      }\`}>
                        {d.label}
                      </div>
                      {staffList.length > 0 && (
                        <div className="grid gap-x-2" style={{ gridTemplateColumns: \`repeat(\${maxConcurrent}, minmax(0, 1fr))\` }}>
                          {staffList.map(s => (
                            <div key={s.id} className="text-center text-[10px] uppercase font-bold text-slate-400 bg-[#0b1221] py-1 rounded border border-[#1e2b4a] truncate px-1">
                              {s.name.split(' ')[0]}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>`;

finalContent = finalContent.replace(dayHeaderRegex, newDayHeader);

fs.writeFileSync(p, finalContent);
console.log("Updated Admin UI for Staff successfully!");
