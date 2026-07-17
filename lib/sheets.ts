import { prisma } from "./prisma";

export type StaffShift = {
  start: string; // e.g., "09:00"
  end: string;   // e.g., "13:00"
};

export type StaffDaySchedule = {
  isOff: boolean;
  shifts: StaffShift[];
};

// Maps a date string "YYYY-MM-DD" to a column index in our Google Sheet
function getColumnIndexForDate(dateStr: string): number {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // In our sheet:
  // Col 0: Nome
  // Col 1: Lunedì (1)
  // Col 2: Martedì (2)
  // Col 3: Mercoledì (3)
  // Col 4: Giovedì (4)
  // Col 5: Venerdì (5)
  // Col 6: Sabato (6)
  // Col 7: Domenica (0)
  
  if (dayOfWeek === 0) return 7; // Sunday
  return dayOfWeek;
}

export async function syncStaffFromSheet(url: string, tenantId: string, locationId?: string) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("URL Google Sheets non valido");
  const docId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error("Impossibile accedere al foglio. Assicurati che sia pubblico.");
  const csvText = await response.text();
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) throw new Error("Il foglio sembra vuoto o non ha il formato corretto.");
  const daysOfWeek = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    const staffName = cols[0];
    if (!staffName || staffName.toLowerCase() === 'dipendente') continue;
    const scheduleObj: any = {};
    for (let d = 0; d < 7; d++) {
      const dayName = daysOfWeek[d];
      const cellValue = cols[d + 1] ? cols[d + 1].toLowerCase().trim() : "riposo";
      const offKeywords = ["riposo", "off", "libero", "ferie", "chiuso", "rest", "free", ""];
      if (offKeywords.includes(cellValue)) {
        scheduleObj[dayName] = { active: false };
      } else {
        const timeBlocks = cellValue.split(',').map(b => b.trim());
        const blocks: { start: string; end: string }[] = [];
        for (const block of timeBlocks) {
          let start: string | undefined, end: string | undefined;
          if (block.includes('-')) {
            [start, end] = block.split('-');
          } else {
            const parts = block.trim().split(/\s+/);
            if (parts.length === 2) [start, end] = parts;
          }
          if (start && end) blocks.push({ start: start.trim(), end: end.trim() });
        }
        scheduleObj[dayName] = { active: true, blocks };
      }
    }
    const existingStaff = locationId
      ? await prisma.staff.findFirst({ where: { tenantId, name: staffName, locationId } })
      : await prisma.staff.findFirst({ where: { tenantId, name: staffName } });
    if (existingStaff) {
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: { baseSchedule: JSON.stringify(scheduleObj) },
      });
      if (locationId) {
        await prisma.staffLocation.upsert({
          where: { staffId_locationId: { staffId: existingStaff.id, locationId } },
          create: { staffId: existingStaff.id, locationId },
          update: {},
        });
      }
    } else {
      const created = await prisma.staff.create({
        data: {
          tenantId,
          name: staffName,
          baseSchedule: JSON.stringify(scheduleObj),
          ...(locationId ? { locationId } : {}),
        },
      });
      if (locationId) {
        await prisma.staffLocation.create({
          data: { staffId: created.id, locationId },
        });
      }
    }
  }
  return { success: true, message: "Orari sincronizzati con successo!" };
}

// Cache in memoria per evitare chiamate ridondanti allo stesso CSV
const sheetCache = new Map<string, { time: number, text: string }>();
const CACHE_TTL_MS = 10000; // 10 secondi

export async function fetchStaffSchedule(sheetUrl: string, staffName: string, dateStr: string): Promise<StaffDaySchedule | null> {
  try {
    // Extract sheet ID from standard sharing URL
    // e.g., https://docs.google.com/spreadsheets/d/1H1pZ1l-G2ZpZzT0nFpS-rI_W_tX7b3O6wP2cIqfL_7s/edit?usp=sharing
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      console.warn("Invalid Google Sheet URL:", sheetUrl);
      return null;
    }
    
    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    let csvText = "";
    const cached = sheetCache.get(csvUrl);
    
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
      csvText = cached.text;
    } else {
      const response = await fetch(csvUrl, { cache: "no-store" });
      if (!response.ok) {
        console.error("Failed to fetch Google Sheet CSV", response.status);
        return null;
      }
      csvText = await response.text();
      sheetCache.set(csvUrl, { time: Date.now(), text: csvText });
    }
    
    const rows = csvText.split("\n").map(r => r.split(","));
    
    // Find the staff row (case insensitive)
    const staffRow = rows.find(row => row[0] && row[0].trim().toLowerCase() === staffName.toLowerCase());
    
    if (!staffRow) {
      return null; // Staff not found in sheet, fallback to general hours
    }
    
    const colIndex = getColumnIndexForDate(dateStr);
    const cellValue = staffRow[colIndex]?.trim() || "";
    
    if (cellValue.toUpperCase() === "OFF" || cellValue === "") {
      return { isOff: true, shifts: [] };
    }
    
    // Parse shifts, e.g., "09:00-13:00" or "09:00-13:00, 15:00-19:00"
    const shifts: StaffShift[] = [];
    const shiftParts = cellValue.split(/[,&/]/); // Allow comma, ampersand, or slash as separators
    
    for (const part of shiftParts) {
      const times = part.split("-");
      if (times.length === 2) {
        shifts.push({
          start: times[0].trim(),
          end: times[1].trim()
        });
      }
    }
    
    if (shifts.length === 0) {
      return { isOff: true, shifts: [] };
    }
    
    return { isOff: false, shifts };
  } catch (error) {
    console.error("Error fetching staff schedule:", error);
    return null;
  }
}
