const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 'api', 'book', 'route.ts');
let content = fs.readFileSync(p, 'utf8');

const regexToReplace = /const overlappingApps = await prisma\.appointment\.findMany\(\{[\s\S]*?if \(hasOverlap\) \{[\s\S]*?return NextResponse\.json\(\{ error: "Spiacenti, qualcuno ha appena prenotato questo orario!" \}, \{ status: 400 \}\);\s*\}/;

const newLogic = `
    const overlappingApps = await prisma.appointment.findMany({
      where: { date: date, tenantId: tenantId },
      select: { time: true, endTime: true, customerName: true, staffId: true }
    });

    // Costruiamo gli intervalli già occupati per STAFF
    const bookedIntervalsByStaff: Record<string, { start: number, end: number }[]> = {};

    overlappingApps.forEach(app => {
      const start = timeToMins(app.time);
      const end = app.endTime ? timeToMins(app.endTime) : start + 15; 
      
      const sId = app.staffId || 'unassigned';
      if (!bookedIntervalsByStaff[sId]) {
        bookedIntervalsByStaff[sId] = [];
      }
      bookedIntervalsByStaff[sId].push({ start, end });
    });

    // Recuperiamo lo Staff capace di eseguire il servizio
    let capableStaffIds: string[] = [];
    const serviceWithStaff = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { staff: true }
    });
    
    if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
      capableStaffIds = serviceWithStaff.staff.map(s => s.id);
    } else {
      const allStaff = await prisma.staff.findMany({ where: { tenantId } });
      if (allStaff.length > 0) {
        capableStaffIds = allStaff.map(s => s.id);
      } else {
        capableStaffIds = ['unassigned'];
      }
    }

    // Trova il primo Staff libero
    let assignedStaffId = null;

    for (const sId of capableStaffIds) {
      const staffIntervals = bookedIntervalsByStaff[sId] || [];
      let staffHasOverlap = false;
      for (const interval of staffIntervals) {
        if (Math.max(startMins, interval.start) < Math.min(endMins, interval.end)) {
          staffHasOverlap = true;
          break;
        }
      }
      if (!staffHasOverlap) {
        assignedStaffId = sId === 'unassigned' ? null : sId;
        break; // Trovato!
      }
    }

    if (assignedStaffId === null && capableStaffIds[0] !== 'unassigned') {
      return NextResponse.json({ error: "Spiacenti, tutti i parrucchieri qualificati sono occupati in questo orario!" }, { status: 400 });
    } else if (assignedStaffId === null && capableStaffIds[0] === 'unassigned') {
       // Se unassigned è fallito vuol dire che c'è overlap generico nei tenant senza staff
       if (bookedIntervalsByStaff['unassigned']?.some(interval => Math.max(startMins, interval.start) < Math.min(endMins, interval.end))) {
         return NextResponse.json({ error: "Spiacenti, orario non disponibile!" }, { status: 400 });
       }
    }
`;

content = content.replace(regexToReplace, newLogic);

// Add staffId to the creation object
content = content.replace(
  'isPaid: isDemoTenant && paymentMethod === "online",',
  'isPaid: isDemoTenant && paymentMethod === "online",\n        staffId: assignedStaffId,'
);

fs.writeFileSync(p, content);
console.log("Updated book route!");
