const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

// I will find everything from `<DayNavigator` to `return cols;` and fix it.
// Actually, it's easier to find the whole chunk starting from `        <div className="flex flex-col flex-1">`
// Wait, I can just find `<DayNavigator currentDate={targetDate} slug={slug} isMultiStaff={isMultiStaff} />`
// and `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">` and replace everything between them!

const startStr = `<DayNavigator currentDate={targetDate} slug={slug} isMultiStaff={isMultiStaff} />`;
const endStr = `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `<DayNavigator currentDate={targetDate} slug={slug} isMultiStaff={isMultiStaff} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-[#1e2b4a] pb-4">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                📒 Agenda Dinamica ({tenantName})
              </h2>

              <div className="flex items-center gap-1 bg-[#131c31] p-1.5 rounded-2xl border border-[#1e2b4a] w-fit">
                <Link
                  href={\`/dashboard?weekOffset=\${weekOffset - 1}\`}
                  prefetch={false}
                  scroll={false}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#1e2b4a] rounded-xl transition font-medium"
                >
                  ← Prec
                </Link>

                <Link
                  href={\`/t/\${slug}/admin\`}
                  prefetch={false}
                  scroll={false}
                  className={\`px-4 py-2 text-sm font-bold rounded-xl transition \${
                    weekOffset === 0
                      ? "bg-[#00b4ff] text-[#050814] shadow-lg shadow-cyan-500/20"
                      : "text-slate-300 hover:bg-[#1e2b4a]"
                  }\`}
                >
                  Oggi
                </Link>

                <Link
                  href={\`/dashboard?weekOffset=\${weekOffset + 1}\`}
                  prefetch={false}
                  scroll={false}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#1e2b4a] rounded-xl transition font-medium"
                >
                  Pros →
                </Link>
              </div>
            </div>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div
              className="min-w-[650px] md:min-w-[900px] grid gap-x-2 gap-y-0"
              style={{
                gridTemplateColumns: \`minmax(60px, 80px) repeat(\${weekDays.length}, repeat(\${maxConcurrent}, minmax(0, 1fr)))\`
              }}
            >
                <div style={{ gridColumn: 1 }} className="text-slate-500 font-bold text-center flex items-center justify-center sticky left-0 bg-[#0b1221] z-20 pb-2 shadow-[8px_0_0_#0b1221] md:shadow-none border-b border-transparent">
                  Ora
                </div>

                {weekDays.map((d, dIndex) => {
                  const isToday = d.date === todayItaly;
                  
                  return (
                    <div key={d.date} style={{ gridColumn: \`span \${maxConcurrent}\` }} className="flex flex-col gap-2 mb-2">
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
                    </div>
                  );
                })}

                {allSlots.map((slot) => {
                  const isQuarter = slot.endsWith("15") || slot.endsWith("45");

                  return (
                    <div className="contents" key={slot}>
                      <div style={{ gridColumn: 1 }} className="w-full h-full text-slate-400 font-medium flex items-center justify-center text-sm bg-[#0b1221] sticky left-0 z-20 border-r border-transparent shadow-[8px_0_0_#0b1221] md:shadow-none">
                        <span
                          className={\`px-2 py-1 rounded-xl transition-all \${
                            isQuarter
                              ? "text-[10px] text-slate-600"
                              : "bg-[#131c31] border border-[#1e2b4a]"
                          }\`}
                        >
                          {slot}
                        </span>
                      </div>

                      {weekDays.map((d, dIndex) => {
                        const cols = [];
                        columns.forEach((colId, cIndex) => {
                          const appt = radarMap[d.date]?.[colId]?.[slot];
                          const cellKey = \`\${d.date}-\${slot}-\${colId}\`;
                          const targetColumn = (dIndex * maxConcurrent) + cIndex + 2;

                          if (appt === "COVERED") {
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
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

        {/* ALTRE FUNZIONI DASHBOARD */}
        `;

  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(p, content);
  console.log("Successfully rebuilt grid layout.");
} else {
  console.log("Could not find start or end bounds.");
}
