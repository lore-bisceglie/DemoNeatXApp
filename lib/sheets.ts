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
    
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      console.error("Failed to fetch Google Sheet CSV", response.status);
      return null;
    }
    
    const csvText = await response.text();
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
