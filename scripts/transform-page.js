const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const radarMapStart = content.indexOf('  const columns = staffList.length > 0 ? staffList.map(s => s.id) : ["unassigned"];');
const freeGapEnds = content.indexOf('          <div className="bg-[#0b1221] p-6 rounded-3xl');

if (radarMapStart === -1 || freeGapEnds === -1) {
  console.log("Could not find radarMapStart or freeGapEnds");
  process.exit(1);
}

const buildAgendaDataFunc = `
  const buildAgendaData = (locId: string | null) => {
    const filteredStaff = !locId ? staffList : staffList.filter(s => 
      s.locationId === locId || (s.locations && s.locations.some((l: any) => l.locationId === locId)) || (!s.locationId && (!s.locations || s.locations.length === 0))
    );
    const cols = filteredStaff.length > 0 ? filteredStaff.map(s => s.id) : ["unassigned"];
    const map: Record<string, Record<string, Record<string, any>>> = {};

    if (isAgendaTab) {
      weekDatesArray.forEach((d) => {
        map[d] = {};
        for (const colId of cols) {
          map[d][colId] = {};
        }
      });

      const filteredAppointments = !locId ? radarAppointmentsRaw : radarAppointmentsRaw.filter(a => a.locationId === locId);

      filteredAppointments.forEach((app) => {
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
          const appWithSpan = { ...app, _rowSpan: slotsToCover };
          const targetCol = app.staffId && cols.includes(app.staffId) ? app.staffId : cols[0];
          const actualTime = app.time === "ALL_DAY" ? "09:00" : app.time;

          if (!map[app.date]) map[app.date] = {};
          if (!map[app.date][targetCol]) map[app.date][targetCol] = {};
          map[app.date][targetCol][actualTime] = appWithSpan;

          for (let idx = 1; idx < slotsToCover; idx++) {
            const coveredSlot = allSlots[startIndex + idx];
            if (coveredSlot) {
              map[app.date][targetCol][coveredSlot] = "COVERED";
            }
          }
        }
      });
    }

    const gaps = weekDays.flatMap((dayInfo) => {
      const g: { date: string; label: string; start: string; end: string; duration: number }[] = [];
      let gapStart: string | null = null;
      let gapDuration = 0;

      allSlots.forEach((slot) => {
        const isPastToday = dayInfo.date === todayItaly && timeToMinutes(slot) <= currentTotalMinutes;
        let isSlotCompletelyFree = false;
        for (const colId of cols) {
          if (!map[dayInfo.date]?.[colId]?.[slot]) {
            isSlotCompletelyFree = true;
            break;
          }
        }
        const isFree = !isPastToday && isSlotCompletelyFree;

        if (isFree) {
          if (!gapStart) gapStart = slot;
          gapDuration += 15;
          return;
        }

        if (gapStart && gapDuration >= 30) {
          g.push({
            date: dayInfo.date,
            label: dayInfo.label,
            start: gapStart,
            end: minutesToTime(timeToMinutes(gapStart) + gapDuration),
            duration: gapDuration,
          });
        }
        gapStart = null;
        gapDuration = 0;
      });

      if (gapStart && gapDuration >= 30) {
        g.push({
          date: dayInfo.date,
          label: dayInfo.label,
          start: gapStart,
          end: minutesToTime(timeToMinutes(gapStart) + gapDuration),
          duration: gapDuration,
        });
      }
      return g;
    });

    return { columns: cols, radarMap: map, freeGapReports: gaps };
  };

  const agendaViews = [{ id: "all", name: "Tutte le sedi", ...buildAgendaData(null) }];
  locations.forEach((loc: any) => {
    agendaViews.push({ id: loc.id, name: loc.name, ...buildAgendaData(loc.id) });
  });
`;

const oldLogic = content.substring(radarMapStart, freeGapEnds);
content = content.replace(oldLogic, buildAgendaDataFunc + "\n");

const locationFilterAreaStart = content.indexOf('            {locations.length > 1 && (');
const locationFilterAreaEnd = content.indexOf('            {/* AGENDA SETTIMANALE TETRIS */}');

if (locationFilterAreaStart !== -1) {
  content = content.substring(0, locationFilterAreaStart) + content.substring(locationFilterAreaEnd);
}

const agendaTetrisComment = content.indexOf('{/* AGENDA SETTIMANALE TETRIS */}');
const servicesTabStart = content.indexOf('          <div data-tab="gestione">');

if (agendaTetrisComment === -1 || servicesTabStart === -1) {
  console.log("Could not find agenda wrapper parts", agendaTetrisComment, servicesTabStart);
  process.exit(1);
}

let agendaContent = content.substring(agendaTetrisComment, servicesTabStart);

const correctWrappedAgendaContent = `
          <AgendaLocationTabbedArea locations={locations} slug={slug}>
            {agendaViews.map(view => {
              const columns = view.columns;
              const radarMap = view.radarMap;
              const freeGapReports = view.freeGapReports;
              return (
                <div key={view.id} data-location={view.id} className="w-full">
` + agendaContent + `
                </div>
              );
            })}
          </AgendaLocationTabbedArea>
`;

content = content.substring(0, agendaTetrisComment) + correctWrappedAgendaContent + content.substring(servicesTabStart);

const importSpot = content.indexOf('import LocationTabs');
if (importSpot !== -1) {
  content = content.substring(0, importSpot) + 'import AgendaLocationTabbedArea from "@/components/admin/AgendaLocationTabbedArea";\n' + content.substring(importSpot);
}

fs.writeFileSync(file, content);
console.log("Transformation completed.");
