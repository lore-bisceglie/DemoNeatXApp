const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let lines = fs.readFileSync(p, 'utf8').split('\n');

const newLines = [];
let i = 0;

while (i < lines.length) {
  let line = lines[i];

  // 1. Add maxConcurrent variable
  if (line.includes('const radarMap: Record<string, Record<string, any>> = {};')) {
    newLines.push('  const maxConcurrent = storeSettings.maxConcurrentAppointments || 1;');
    newLines.push('  const radarMap: Record<string, Record<number, Record<string, any>>> = {};');
    i++;
    continue;
  }

  // 2. Map init logic
  if (line.includes('weekDatesArray.forEach((d) => {')) {
    newLines.push(line);
    newLines.push('    radarMap[d] = {};');
    newLines.push('    for (let c = 0; c < maxConcurrent; c++) {');
    newLines.push('      radarMap[d][c] = {};');
    newLines.push('    }');
    newLines.push('  });');
    
    // Skip the old init lines:
    //    radarMap[d] = {};
    //  });
    i += 3;
    continue;
  }

  // 3. radarAppointments parsing logic
  if (line.includes('radarAppointments.forEach((app) => {')) {
    // Add new logic
    newLines.push(`  radarAppointments.forEach((app) => {
    let durationMins = 15;
    if (app.time === "ALL_DAY") {
      durationMins = allSlots.length * 15;
    } else if (app.service?.duration) {
      durationMins = app.service.duration;
    } else if (app.endTime) {
      const start = app.time.split(":").map(Number);
      const end = app.endTime.split(":").map(Number);
      durationMins = end[0] * 60 + end[1] - (start[0] * 60 + start[1]);
    }

    const slotsToCover = Math.ceil(durationMins / 15);
    const startIndex = app.time === "ALL_DAY" ? 0 : allSlots.indexOf(app.time);

    if (startIndex !== -1) {
      const appWithSpan = {
        ...app,
        _rowSpan: slotsToCover,
      };

      let targetCol = 0;
      for (let c = 0; c < maxConcurrent; c++) {
        let isFree = true;
        for (let idx = 0; idx < slotsToCover; idx++) {
          const slotToCheck = allSlots[startIndex + idx];
          if (slotToCheck && radarMap[app.date][c][slotToCheck]) {
            isFree = false;
            break;
          }
        }
        if (isFree) {
          targetCol = c;
          break;
        }
      }

      const actualTime = app.time === "ALL_DAY" ? "09:00" : app.time;
      radarMap[app.date][targetCol][actualTime] = appWithSpan;

      for (let idx = 1; idx < slotsToCover; idx++) {
        const coveredSlot = allSlots[startIndex + idx];
        if (coveredSlot) {
          radarMap[app.date][targetCol][coveredSlot] = "COVERED";
        }
      }
    }
  });`);
    
    // Skip old parsing block up to the freeGapReports definition
    while (i < lines.length && !lines[i].includes('const freeGapReports = weekDays')) {
      i++;
    }
    continue; // Continue loop, next line will be processed in the next iteration
  }

  // 4. Gap Reports logic
  if (line.includes('const isFree = !isPastToday && !radarMap[dayInfo.date]?.[slot];')) {
    newLines.push(`        let isSlotCompletelyFree = false;
        for (let c = 0; c < maxConcurrent; c++) {
          if (!radarMap[dayInfo.date]?.[c]?.[slot]) {
            isSlotCompletelyFree = true;
            break;
          }
        }
        const isFree = !isPastToday && isSlotCompletelyFree;`);
    i++;
    continue;
  }

  // 5. UI Grid layout
  if (line.includes('className="min-w-[650px] md:min-w-[900px] grid grid-cols-[60px_repeat(5,1fr)] md:grid-cols-[80px_repeat(5,1fr)] gap-x-2 gap-y-0"')) {
    newLines.push('            <div');
    newLines.push('              className="min-w-[650px] md:min-w-[900px] grid gap-x-2 gap-y-0"');
    newLines.push('              style={{');
    newLines.push('                gridTemplateColumns: `minmax(60px, 80px) repeat(5, repeat(${maxConcurrent}, minmax(0, 1fr)))`');
    newLines.push('              }}');
    newLines.push('            >');
    i++;
    continue;
  }

  // 6. weekDays Map - Headers
  if (line.includes('className={`text-center py-2 mb-2 rounded-xl border capitalize transition-colors ${') && i > 800 && i < 830) {
    newLines.push('                      style={{ gridColumn: `span ${maxConcurrent}` }}');
    newLines.push(line);
    i++;
    continue;
  }

  // 7. weekDays Map - Cells
  if (line.includes('const appt = radarMap[d.date]?.[slot];') && i > 830 && i < 880) {
    // Inject the new loop logic starting from {weekDays.map(d => {
    // Wait, the structure in the file is:
    // {weekDays.map((d) => {
    //   const appt = radarMap[d.date]?.[slot];
    // We need to inject the `for` loop *after* the map starts.
    // Let's replace the whole {weekDays.map((d) => { block.
    
    // Instead of doing it here, let's find the exact block and replace it.
  }

  newLines.push(line);
  i++;
}

fs.writeFileSync(p, newLines.join('\n'));

// Now replace the weekDays cell mapping using regex for JUST THAT PART
let finalContent = fs.readFileSync(p, 'utf8');

const cellMatch = /\{weekDays\.map\(\(d\) => \{\s*const appt = radarMap\[d\.date\]\?\.\[slot\];\s*if \(appt === "COVERED"\) return null;\s*if \(appt\) \{\s*const \[y, m, dStr\] = d\.date\.split\("-"\);\s*return \(\s*<div\s*key=\{`\$\{d\.date\}-\$\{slot\}`\}\s*style=\{\{\s*gridRow: `span \$\{appt\._rowSpan\} \/ span \$\{appt\._rowSpan\}`,\s*\}\}\s*className="h-full min-h-\[40px\] py-\[4px\]"\s*>\s*<AppointmentBlock\s*appt=\{appt\}\s*italianDate=\{`\$\{dStr\}\/\$\{m\}\/\$\{y\}`\}\s*durationInMinutes=\{appt\._rowSpan \* 15\}\s*\/>\s*<\/div>\s*\);\s*\}\s*return \(\s*<div key=\{`\$\{d\.date\}-\$\{slot\}`\} className="h-full min-h-\[40px\] py-\[4px\]">\s*<WalkInButton\s*date=\{d\.date\}\s*time=\{slot\}\s*tenantId=\{tenantId\}\s*services=\{tenantServices\}\s*\/>\s*<\/div>\s*\);\s*\}\)\}/;

const newCells = `{weekDays.map((d) => {
                        const cols = [];
                        for (let c = 0; c < maxConcurrent; c++) {
                          const appt = radarMap[d.date]?.[c]?.[slot];
                          const cellKey = \`\${d.date}-\${slot}-\${c}\`;

                          if (appt === "COVERED") {
                            cols.push(<div key={cellKey} className="hidden"></div>);
                            continue;
                          }

                          if (appt) {
                            const [y, m, dStr] = d.date.split("-");
                            cols.push(
                              <div
                                key={cellKey}
                                style={{
                                  gridRow: \`span \${appt._rowSpan} / span \${appt._rowSpan}\`,
                                }}
                                className="h-full min-h-[40px] py-[4px]"
                              >
                                <AppointmentBlock
                                  appt={appt}
                                  italianDate={\`\${dStr}/\${m}/\${y}\`}
                                  durationInMinutes={appt._rowSpan * 15}
                                />
                              </div>
                            );
                            continue;
                          }

                          cols.push(
                            <div key={cellKey} className="h-full min-h-[40px] py-[4px]">
                              <WalkInButton
                                date={d.date}
                                time={slot}
                                tenantId={tenantId}
                                services={tenantServices}
                              />
                            </div>
                          );
                        }
                        return cols;
                      })}`;

finalContent = finalContent.replace(cellMatch, newCells);

fs.writeFileSync(p, finalContent);
console.log("Safe rewrite completed.");
