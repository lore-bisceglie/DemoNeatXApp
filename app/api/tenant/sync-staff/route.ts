import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { tenantId, url } = await request.json();

    if (!tenantId || !url) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    // 1. Salva l'URL nel DB
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { staffSheetUrl: url }
    });

    // 2. Estrai l'ID del documento Google Sheet dall'URL
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return NextResponse.json({ error: "URL Google Sheets non valido" }, { status: 400 });
    }
    const docId = match[1];

    // 3. Scarica il file in formato CSV (pubblico)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: "Impossibile accedere al foglio. Assicurati che sia impostato su 'Chiunque abbia il link può leggere'" }, { status: 400 });
    }

    const csvText = await response.text();
    
    // 4. Parsing del CSV (supporta testo tra virgolette nel CSV per virgole interne)
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "Il foglio sembra vuoto o non ha il formato corretto." }, { status: 400 });
    }

    const daysOfWeek = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
    
    for (let i = 1; i < lines.length; i++) {
      // Regex base per ignorare le virgole dentro le virgolette
      const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      const staffName = cols[0];
      
      if (!staffName || staffName.toLowerCase() === 'dipendente') continue;

      let scheduleObj: any = {};
      
      for (let d = 0; d < 7; d++) {
        const dayName = daysOfWeek[d];
        const cellValue = cols[d + 1] ? cols[d + 1].toLowerCase().trim() : "riposo";
        
        const offKeywords = ["riposo", "off", "libero", "ferie", "chiuso", "rest", "free", ""];
        if (offKeywords.includes(cellValue)) {
           scheduleObj[dayName] = { active: false };
        } else {
           // Supporta: "09:00-13:00, 14:00-18:00" oppure "09:00 13:00, 14:00 18:00"
           const timeBlocks = cellValue.split(',').map(b => b.trim());
           let blocks = [];
           for (const block of timeBlocks) {
             let start, end;
             if (block.includes('-')) {
               [start, end] = block.split('-');
             } else {
               // Formato con spazio: "09:00 13:00"
               const parts = block.trim().split(/\s+/);
               if (parts.length === 2) {
                 [start, end] = parts;
               }
             }
             if (start && end) {
               blocks.push({ start: start.trim(), end: end.trim() });
             }
           }
           scheduleObj[dayName] = { active: true, blocks };
        }
      }

      const existingStaff = await prisma.staff.findFirst({
        where: { tenantId, name: staffName }
      });

      if (existingStaff) {
        await prisma.staff.update({
          where: { id: existingStaff.id },
          data: { baseSchedule: JSON.stringify(scheduleObj) }
        });
      } else {
        await prisma.staff.create({
          data: {
            tenantId,
            name: staffName,
            baseSchedule: JSON.stringify(scheduleObj)
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Orari sincronizzati con successo!" });

  } catch (error: any) {
    console.error("Sync Staff API Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno durante la sincronizzazione" }, { status: 500 });
  }
}
