const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

const maxConcurrentVar = 'const maxConcurrent = storeSettings.maxConcurrentAppointments || 1;';
if (!content.includes(maxConcurrentVar)) {
  content = content.replace(
    'const radarMap: Record<string, Record<string, any>> = {};',
    `${maxConcurrentVar}\n  const radarMap: Record<string, Record<number, Record<string, any>>> = {};`
  );
}

const mapInitLogic = `
  weekDatesArray.forEach((d) => {
    radarMap[d] = {};
    for (let c = 0; c < maxConcurrent; c++) {
      radarMap[d][c] = {};
    }
  });`;

content = content.replace(/weekDatesArray\.forEach\(\(d\) => \{\s*radarMap\[d\] = \{\};\s*\}\);/, mapInitLogic);

const parsingLogicRegex = /radarAppointments\.forEach\(\(app\) => \{[\s\S]*?\}\);/g;

const newParsingLogic = `radarAppointments.forEach((app) => {
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

      // Trova la prima colonna libera per questo appuntamento
      let targetCol = 0;
      for (let c = 0; c < maxConcurrent; c++) {
        let isFree = true;
        for (let i = 0; i < slotsToCover; i++) {
          const slotToCheck = allSlots[startIndex + i];
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

      for (let i = 1; i < slotsToCover; i++) {
        const coveredSlot = allSlots[startIndex + i];
        if (coveredSlot) {
          radarMap[app.date][targetCol][coveredSlot] = "COVERED";
        }
      }
    }
  });`;

content = content.replace(parsingLogicRegex, newParsingLogic);

const gapReportRegex = /const isFree = !isPastToday && !radarMap\[dayInfo\.date\]\?\.\[slot\];/g;
const newGapReport = `
        let isSlotCompletelyFree = false;
        for (let c = 0; c < maxConcurrent; c++) {
          if (!radarMap[dayInfo.date]?.[c]?.[slot]) {
            isSlotCompletelyFree = true;
            break; // Basta una colonna libera per considerare lo slot prenotabile
          }
        }
        const isFree = !isPastToday && isSlotCompletelyFree;`;

content = content.replace(gapReportRegex, newGapReport);

// Now update the UI Grid
const uiGridRegex = /<div className="min-w-\[650px\] md:min-w-\[900px\] grid grid-cols-\[60px_repeat\(5,1fr\)\] md:grid-cols-\[80px_repeat\(5,1fr\)\] gap-x-2 gap-y-0">/;
const newUiGrid = `<div 
              className="min-w-[650px] md:min-w-[900px] grid gap-x-2 gap-y-0"
              style={{
                gridTemplateColumns: \`minmax(60px, 80px) repeat(5, repeat(\${maxConcurrent}, minmax(0, 1fr)))\`
              }}
            >`;
content = content.replace(uiGridRegex, newUiGrid);

// Update WeekDays headers to span across multiple columns
const weekDayHeaderRegex = /<div\s*key=\{d\.date\}\s*className={`text-center py-2 mb-2 rounded-xl border capitalize transition-colors \$\{[\s\S]*?\}`\}\s*>/g;
content = content.replace(weekDayHeaderRegex, (match) => {
  return match.replace(
    'className={`text-center',
    `style={{ gridColumn: \`span \${maxConcurrent}\` }} className={\`text-center`
  );
});

// Update the actual cells
const actualCellRegex = /\{weekDays\.map\(\(d\) => \{[\s\S]*?return \([\s\S]*?<WalkInButton[\s\S]*?\/>\s*<\/div>\s*\);\s*\}\)\}/g;

const newActualCell = `{weekDays.map((d) => {
                        const cols = [];
                        for (let c = 0; c < maxConcurrent; c++) {
                          const appt = radarMap[d.date]?.[c]?.[slot];

                          if (appt === "COVERED") {
                            cols.push(<div key={\`\${d.date}-\${slot}-\${c}\`} className="hidden"></div>);
                            continue;
                          }

                          if (appt) {
                            const [y, m, dStr] = d.date.split("-");
                            cols.push(
                              <div
                                key={\`\${d.date}-\${slot}-\${c}\`}
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
                            <div key={\`\${d.date}-\${slot}-\${c}\`} className="h-full min-h-[40px] py-[4px]">
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

content = content.replace(actualCellRegex, newActualCell);

fs.writeFileSync(p, content);
console.log("Updated radarMap and Grid!");
