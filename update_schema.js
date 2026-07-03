const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(p, 'utf8');

// Rimuovere maxConcurrentAppointments da StoreSettings
content = content.replace(/  maxConcurrentAppointments Int      @default\(1\) \/\/ Numero massimo di appuntamenti sovrapposti \(Multi-staff\)\n/, '');

// Aggiungere staffId in Appointment
if (!content.includes('staffId')) {
  content = content.replace(
    '  service       Service? @relation(fields: [serviceId], references: [id])',
    '  service       Service? @relation(fields: [serviceId], references: [id])\n\n  // Relazione con lo Staff che esegue il servizio\n  staffId       String?\n  staff         Staff?   @relation(fields: [staffId], references: [id])'
  );
}

// Aggiungere Staff array in Service per la relazione molti-a-molti
if (!content.includes('staff        Staff[]')) {
  content = content.replace(
    '  appointments Appointment[]',
    '  appointments Appointment[]\n\n  // Membri dello staff che possono eseguire questo servizio\n  staff        Staff[]'
  );
}

// Aggiungere modello Staff e collegamenti in Tenant
const staffModel = `
// ------------------------------------------------------
// 9. STAFF E SPECIALIZZAZIONI
// ------------------------------------------------------
model Staff {
  id           String        @id @default(cuid())
  name         String        // Es. "Marco", "Giulia"
  tenantId     String
  tenant       Tenant        @relation(fields: [tenantId], references: [id])

  // Servizi che questo dipendente può svolgere
  services     Service[]

  // Appuntamenti assegnati a questo dipendente
  appointments Appointment[]
}
`;

if (!content.includes('model Staff {')) {
  content += staffModel;
}

if (!content.includes('staff         Staff[]') && content.includes('activityLogs  ActivityLog[]')) {
  content = content.replace(
    '  activityLogs  ActivityLog[]',
    '  activityLogs  ActivityLog[]\n  staff         Staff[]'
  );
}

fs.writeFileSync(p, content);
console.log('Prisma schema updated.');
