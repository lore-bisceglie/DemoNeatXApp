const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 'api', 'book', 'route.ts');
let content = fs.readFileSync(p, 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Add staffId: explicitStaffId to destructuring
const destructureTarget = `      serviceId,
      duration,
      paymentMethod,
    } = body;`;
const destructureReplacement = `      serviceId,
      duration,
      paymentMethod,
      staffId: explicitStaffId,
    } = body;`;
if (content.includes(destructureTarget)) {
  content = content.replace(destructureTarget, destructureReplacement);
}

// 2. Modify staff logic to respect explicitStaffId
const logicTarget = `    if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
      capableStaffIds = serviceWithStaff.staff.map(s => s.id);
    } else {
      const allStaff = await prisma.staff.findMany({ where: { tenantId } });
      if (allStaff.length > 0) {
        capableStaffIds = allStaff.map(s => s.id);
      } else {
        capableStaffIds = ['unassigned'];
      }
    }`;
const logicReplacement = `    if (explicitStaffId) {
      capableStaffIds = [explicitStaffId];
    } else if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
      capableStaffIds = serviceWithStaff.staff.map(s => s.id);
    } else {
      const allStaff = await prisma.staff.findMany({ where: { tenantId } });
      if (allStaff.length > 0) {
        capableStaffIds = allStaff.map(s => s.id);
      } else {
        capableStaffIds = ['unassigned'];
      }
    }`;
if (content.includes(logicTarget)) {
  content = content.replace(logicTarget, logicReplacement);
}

fs.writeFileSync(p, content);
console.log("Book API updated successfully");
