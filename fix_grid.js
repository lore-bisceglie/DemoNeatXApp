const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

// 1. Fix grid template columns
content = content.replace(
  /gridTemplateColumns: `minmax\(60px, 80px\) repeat\(5, repeat\(\$\{maxConcurrent\}, minmax\(0, 1fr\)\)\)`/,
  'gridTemplateColumns: `minmax(60px, 80px) repeat(${weekDays.length}, repeat(${maxConcurrent}, minmax(0, 1fr)))`'
);

// 2. Fix the loop mapping
const loopRegex = /\{weekDays\.map\(\(d\) => \{[\s\S]*?return cols;\s*\}\)\}/;

const newLoop = `{weekDays.map((d, dIndex) => {
                        const cols = [];
                        columns.forEach((colId, cIndex) => {
                          const appt = radarMap[d.date]?.[colId]?.[slot];
                          const cellKey = \`\${d.date}-\${slot}-\${colId}\`;
                          const targetColumn = (dIndex * maxConcurrent) + cIndex + 2;

                          if (appt === "COVERED") {
                            // Non aggiungiamo nulla, CSS grid posizionerà correttamente il resto
                            return;
                          }

                          if (appt) {
                            const [y, m, dStr] = d.date.split("-");
                            cols.push(
                              <div
                                key={cellKey}
                                style={{
                                  gridRow: \`span \${appt._rowSpan} / span \${appt._rowSpan}\`,
                                  gridColumn: targetColumn
                                }}
                                className="h-full min-h-[40px] py-[4px] relative z-10"
                              >
                                <AppointmentBlock
                                  appt={appt}
                                  italianDate={\`\${dStr}/\${m}/\${y}\`}
                                  durationInMinutes={appt._rowSpan * 15}
                                />
                              </div>
                            );
                            return;
                          }

                          cols.push(
                            <div key={cellKey} style={{ gridColumn: targetColumn }} className="h-full min-h-[40px] py-[4px]">
                              <WalkInButton
                                date={d.date}
                                time={slot}
                                tenantId={tenantId}
                                services={tenantServices}
                              />
                            </div>
                          );
                        });
                        return cols;
                      })}`;

content = content.replace(loopRegex, newLoop);

// Add gridColumn: 1 to the time label
const timeLabelRegex = /<div className="w-full h-full text-slate-400 font-medium flex items-center justify-center text-sm bg-\[#0b1221\] sticky left-0 z-20 border-r border-transparent shadow-\[8px_0_0_#0b1221\] md:shadow-none">/;
content = content.replace(
  timeLabelRegex,
  '<div style={{ gridColumn: 1 }} className="w-full h-full text-slate-400 font-medium flex items-center justify-center text-sm bg-[#0b1221] sticky left-0 z-20 border-r border-transparent shadow-[8px_0_0_#0b1221] md:shadow-none">'
);

fs.writeFileSync(p, content);
console.log("Grid loop fixed!");
