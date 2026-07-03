const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

// Convert \r\n to \n for consistent matching
content = content.replace(/\r\n/g, '\n');

const targetStr = `          });
            </a>
            <a`;

const replacement = `          });
          const hasOverlap = overlapCount >= (storeSettings?.maxConcurrentAppointments || 1);

          if (hasOverlap) {
            redirectUrl = \`/t/\${slug}/admin?error=MULTIPLE_CONFLICTS\`;
          } else {
            await prisma.appointment.create({
              data: {
                customerName: "☕ PAUSA",
                customerPhone: "0000000000",
                date,
                time: startTime,
                endTime,
                tenantId,
                cancelToken: crypto.randomUUID(),
              },
            });
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    redirect(redirectUrl);
  }

  async function blockHoliday(formData: FormData) {
    "use server";

    let redirectUrl = \`/t/\${slug}/admin\`;

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const datesToBlock = [];
      const checkLoop = new Date(start);

      while (checkLoop <= end) {
        datesToBlock.push(checkLoop.toISOString().split("T")[0]);
        checkLoop.setDate(checkLoop.getDate() + 1);
      }

      try {
        const existingAppointments = await prisma.appointment.findMany({
          where: {
            date: {
              in: datesToBlock,
            },
            tenantId,
            NOT: [
              { customerName: { contains: "PAUSA" } },
              { customerName: { contains: "FERIE" } },
              { time: "ALL_DAY" },
            ],
          },
        });

        if (existingAppointments.length > 0) {
          redirectUrl = \`/t/\${slug}/admin?error=MULTIPLE_CONFLICTS\`;
        } else {
          const insertLoop = new Date(start);

          while (insertLoop <= end) {
            const d = insertLoop.toISOString().split("T")[0];

            const existingFerie = await prisma.appointment.findFirst({
              where: {
                date: d,
                time: "ALL_DAY",
                tenantId,
              },
            });

            if (!existingFerie) {
              await prisma.appointment.create({
                data: {
                  customerName: "🌴 FERIE",
                  customerPhone: "0000000000",
                  date: d,
                  time: "ALL_DAY",
                  tenantId,
                  cancelToken: crypto.randomUUID(),
                },
              });
            }

            insertLoop.setDate(insertLoop.getDate() + 1);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    redirect(redirectUrl);
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col p-4 sm:p-8 font-sans text-slate-200 selection:bg-cyan-500/30">
      <AutoRefreshMonitor appointmentCount={rawAppointments.length} />

      <div className="max-w-7xl mx-auto w-full flex-grow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-white">Neat</span>
            <span className="text-[#00b4ff]">X</span>
            <span className="text-slate-500 font-medium text-2xl ml-2">
              | Agenda Privata {tenantName}
            </span>
          </h1>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar snap-x">
            <TeamDrawer tenantId={tenantId} isPremium={isPremium} allServices={tenantServices} />
            <CustomerDrawer tenantId={tenantId} />
            <a
              href={\`/api/export/appointments?tenantId=\${tenantId}\`}
              className="flex-shrink-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-emerald-500/30 transition flex justify-center items-center gap-2 whitespace-nowrap snap-center"
            >
              Export agenda
            </a>
            <a`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(p, content);
  console.log("Restored missing lines!");
} else {
  console.log("TARGET STRING NOT FOUND!");
}
