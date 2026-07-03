const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

const regex = /const hasOverlap = existingApps\.some\(\(app\) => \{[\s\S]*?\}\);/g;

const replacement = `let overlapCount = 0;
          existingApps.forEach((app) => {
            const aStart =
              parseInt(app.time.split(":")[0]) * 60 +
              parseInt(app.time.split(":")[1]);

            const aEnd = app.endTime
              ? parseInt(app.endTime.split(":")[0]) * 60 +
                parseInt(app.endTime.split(":")[1])
              : aStart + 15;

            if (Math.max(startMins, aStart) < Math.min(endMins, aEnd)) {
              overlapCount++;
            }
          });
          const hasOverlap = overlapCount >= storeSettings.maxConcurrentAppointments;`;

content = content.replace(regex, replacement);

fs.writeFileSync(p, content);
console.log("Updated!");
