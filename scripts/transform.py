import sys

with open('app/t/[slug]/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '  const columns = staffList.length > 0 ? staffList.map(s => s.id) : ["unassigned"];'
end_marker = '  const appointments = rawAppointments.filter((app) => {'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Not found start or end')
    sys.exit(1)

new_code = '''  const buildAgendaData = (locId: string | null) => {
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
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.start.localeCompare(b.start);
      return a.date.localeCompare(b.date);
    })
    .slice(0, 6);

    return { columns: cols, radarMap: map, freeGapReports: gaps };
  };

  const agendaViews = [{ id: "all", name: "Tutte le sedi", ...buildAgendaData(null) }];
  locations.forEach((loc: any) => {
    agendaViews.push({ id: loc.id, name: loc.name, ...buildAgendaData(loc.id) });
  });

'''

content = content[:start_idx] + new_code + content[end_idx:]

loc_filter_start = content.find('            {locations.length > 1 && (')
agenda_tetris = content.find('{/* AGENDA SETTIMANALE TETRIS */}')
gestione_tab = content.find('          <div data-tab="gestione">')

if loc_filter_start == -1 or agenda_tetris == -1 or gestione_tab == -1:
    print('Not found loc_filter, tetris or gestione', loc_filter_start, agenda_tetris, gestione_tab)
    sys.exit(1)

# we want to replace from loc_filter_start to gestione_tab
# Actually, wait. I can just slice loc_filter_start out entirely?
# Yes, loc_filter_start is the start of {locations.length > 1 && ( which is the location buttons!
# They end right before genda_tetris.
# So we can just drop that part!
content = content[:loc_filter_start] + content[agenda_tetris:]

# Recompute after slice
agenda_tetris = content.find('{/* AGENDA SETTIMANALE TETRIS */}')
gestione_tab = content.find('          <div data-tab="gestione">')

agenda_content = content[agenda_tetris:gestione_tab]

new_agenda_content = '''          <AgendaLocationTabbedArea locations={locations} slug={slug}>
            {agendaViews.map(view => {
              const columns = view.columns;
              const radarMap = view.radarMap;
              const freeGapReports = view.freeGapReports;
              const maxConcurrent = columns.length;
              return (
                <div key={view.id} data-location={view.id} className="w-full">
                  ''' + agenda_content + '''
                </div>
              );
            })}
          </AgendaLocationTabbedArea>
'''

content = content[:agenda_tetris] + new_agenda_content + content[gestione_tab:]

import_idx = content.find('import LocationTabs')
if import_idx != -1:
    content = content[:import_idx] + 'import AgendaLocationTabbedArea from "@/components/admin/AgendaLocationTabbedArea";\n' + content[import_idx:]

with open('app/t/[slug]/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
