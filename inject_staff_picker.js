const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Add selectedStaffId state
if (!content.includes('const [selectedStaffId, setSelectedStaffId] = useState<string>("any");')) {
  const stateTarget = `  const [selectedService, setSelectedService] = useState<Service | null>(null);`;
  const stateReplacement = `  const [selectedService, setSelectedService] = useState<Service | null>(null);\n  const [selectedStaffId, setSelectedStaffId] = useState<string>("any");`;
  content = content.replace(stateTarget, stateReplacement);
}

// 2. Add staff to tenantInfo state
if (!content.includes('staff: [] as any[]')) {
  const tenantInfoTarget = `    isDemo: false,
    trialExpired: false,
  });`;
  const tenantInfoReplacement = `    isDemo: false,
    trialExpired: false,
    isPremium: false,
    staff: [] as any[],
  });`;
  content = content.replace(tenantInfoTarget, tenantInfoReplacement);
}

// 3. Update tenant fetch response handling
if (!content.includes('isPremium: data.isPremium')) {
  const fetchTarget = `          isDemo: false,
          trialExpired: data.trialExpired || false,
        });`;
  const fetchReplacement = `          isDemo: false,
          trialExpired: data.trialExpired || false,
          isPremium: data.isPremium || false,
          staff: data.staff || [],
        });`;
  content = content.replace(fetchTarget, fetchReplacement);
}

// 4. Update the slots fetch to include staffId
if (!content.includes('staffId=${selectedStaffId}')) {
  const fetchSlotsTarget = `fetch(\`/api/availability?date=\${date}&tenantId=\${tenantInfo.id}&duration=\${selectedService.duration}&serviceId=\${selectedService.id}\`)`;
  const fetchSlotsReplacement = `fetch(\`/api/availability?date=\${date}&tenantId=\${tenantInfo.id}&duration=\${selectedService.duration}&serviceId=\${selectedService.id}&staffId=\${selectedStaffId === 'any' ? '' : selectedStaffId}\`)`;
  content = content.replace(fetchSlotsTarget, fetchSlotsReplacement);
}

// 5. Reset staffId when service changes
if (!content.includes('setSelectedStaffId("any");')) {
  const onChangeTarget = `                setSelectedService(s || null);
                setSlots([]);`;
  const onChangeReplacement = `                setSelectedService(s || null);
                setSelectedStaffId("any");
                setSlots([]);`;
  content = content.replace(onChangeTarget, onChangeReplacement);
}

// 6. Insert Staff Picker UI right after the Service Selector
const uiTarget = `        )}

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-slate-300">
            Scegli il giorno
          </label>`;

const uiReplacement = `        )}

        {/* STAFF PICKER - SOLO PREMIUM */}
        {tenantInfo.isPremium && selectedService && tenantInfo.staff && tenantInfo.staff.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-slate-300">
              Scegli il professionista (Opzionale)
            </label>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 snap-x">
              <button
                type="button"
                onClick={() => { setSelectedStaffId("any"); setSlots([]); setSelectedSlot(""); }}
                className={\`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition snap-center \${
                  selectedStaffId === "any"
                    ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff]"
                    : "bg-[#131c31] text-slate-400 border-[#1e2b4a] hover:border-slate-500"
                }\`}
              >
                Nessuna preferenza
              </button>
              
              {tenantInfo.staff
                .filter((s: any) => s.services.some((srv: any) => srv.id === selectedService.id))
                .map((staff: any) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => { setSelectedStaffId(staff.id); setSlots([]); setSelectedSlot(""); }}
                    className={\`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition snap-center \${
                      selectedStaffId === staff.id
                        ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff]"
                        : "bg-[#131c31] text-slate-300 border-[#1e2b4a] hover:border-slate-500"
                    }\`}
                  >
                    {staff.name}
                  </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-slate-300">
            Scegli il giorno
          </label>`;

if (content.includes(uiTarget) && !content.includes('STAFF PICKER - SOLO PREMIUM')) {
  content = content.replace(uiTarget, uiReplacement);
}

// 7. Update booking submission payload to include staffId
if (!content.includes('staffId: finalStaffId')) {
  const submitTarget = `          cancelToken,
        }),
      });`;
  const submitReplacement = `          cancelToken,
          staffId: finalStaffId,
        }),
      });`;
  
  // Need to define finalStaffId before the fetch
  const beforeSubmitTarget = `      const res = await fetch("/api/book", {`;
  const beforeSubmitReplacement = `      const finalStaffId = selectedStaffId === 'any' ? null : selectedStaffId;\n      const res = await fetch("/api/book", {`;

  if (content.includes(submitTarget) && content.includes(beforeSubmitTarget)) {
    content = content.replace(beforeSubmitTarget, beforeSubmitReplacement);
    content = content.replace(submitTarget, submitReplacement);
  }
}

fs.writeFileSync(p, content);
console.log("Script eseguito con successo");
