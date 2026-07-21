import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, 'app/t/[slug]/BookingClient.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Change the export default to export function and change params to slug, initialData
content = content.replace(
  'export default function TenantPage(props: { params: Promise<{ slug: string }> }) {\n  const params = use(props.params);',
  'export function BookingClient({ slug, initialData }: { slug: string, initialData: any }) {'
);

// 2. Change useEffect fetching to a simple initialization hook
const fetchEffect = `  useEffect(() => {
    fetch(\`/api/tenant/\${params.slug}\`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setTenantError(data.error);
          setLoadingTenant(false);
          return;
        }
        let parsedClosedDays = [];
        try {
          if (data.closedDays) parsedClosedDays = JSON.parse(data.closedDays);
        } catch (e) {}
        setTenantInfo({
          id: data.id,
          name: data.name,
          address: data.address || "",
          phone: data.phone || "",
          openTime: data.openTime || "09:00",
          closeTime: data.closeTime || "19:00",
          breakStart: data.breakStart || "",
          breakEnd: data.breakEnd || "",
          closedDays: parsedClosedDays,
          instagramUrl: data.instagramUrl || "",
          mapsLink: data.mapsLink || (data.address ? \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(data.address)}\` : ""),
          tiktokUrl: data.tiktokUrl || "",
          bookingUrl: data.bookingUrl || "",
          trialEndsAt: data.trialEndsAt || "",
          isDemo: Boolean(data.isDemoData),
          trialExpired: data.trialExpired || false,
          trialStatus: data.trialStatus || "demo",
          category: data.category || "",
          description: data.description || "",
          city: data.city || "",
          isPremium: data.isPremium || false,
          staff: data.staff || [],
          logoUrl: data.logoUrl || "",
          themeColor: data.themeColor || "cyan",
          storeSettings: data.storeSettings || null,
        });
        setServices(data.services || []);
        const locs = data.locations || [];
        setLocations(locs);
        if (locs.length === 1) {
          setSelectedLocationId(locs[0].id);
        } else if (locs.length > 0) {
          setSelectedLocationId("");
        }
        if (data.services && data.services.length > 0) {
          const firstService = data.services[0];
          setSelectedService(firstService);
          
          let defaultStaff = "any";
          if (data.staff && data.staff.length > 0) {
            const capableStaff = data.staff.find((st: any) => st.services.some((srv: any) => srv.id === firstService.id));
            if (capableStaff) defaultStaff = capableStaff.id;
          }
          setSelectedStaffId(defaultStaff);
        } else {
          setInitialLoad(false);
          setDateError("Nessun servizio configurato per questo negozio.");
        }
        setLoadingTenant(false);
      })
      .catch(err => {
        setTenantError("Errore di caricamento");
        setLoadingTenant(false);
      });
  }, [params.slug]);`;

const newEffect = `  useEffect(() => {
    const data = initialData;
    if (!data) return;
    
    let parsedClosedDays = [];
    try {
      if (data.closedDays) parsedClosedDays = JSON.parse(data.closedDays);
    } catch (e) {}
    setTenantInfo({
      id: data.id,
      name: data.name,
      address: data.address || "",
      phone: data.phone || "",
      openTime: data.openTime || "09:00",
      closeTime: data.closeTime || "19:00",
      breakStart: data.breakStart || "",
      breakEnd: data.breakEnd || "",
      closedDays: parsedClosedDays,
      instagramUrl: data.instagramUrl || "",
      mapsLink: data.mapsLink || (data.address ? \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(data.address)}\` : ""),
      tiktokUrl: data.tiktokUrl || "",
      bookingUrl: data.bookingUrl || "",
      trialEndsAt: data.trialEndsAt || "",
      isDemo: Boolean(data.isDemoData),
      trialExpired: data.trialExpired || false,
      trialStatus: data.trialStatus || "demo",
      category: data.category || "",
      description: data.description || "",
      city: data.city || "",
      isPremium: data.isPremium || false,
      staff: data.staff || [],
      logoUrl: data.logoUrl || "",
      themeColor: data.themeColor || "cyan",
      storeSettings: data.storeSettings || null,
    });
    setServices(data.services || []);
    const locs = data.locations || [];
    setLocations(locs);
    if (locs.length === 1) {
      setSelectedLocationId(locs[0].id);
    } else if (locs.length > 0) {
      setSelectedLocationId("");
    }
    if (data.services && data.services.length > 0) {
      const firstService = data.services[0];
      setSelectedService(firstService);
      
      let defaultStaff = "any";
      if (data.staff && data.staff.length > 0) {
        const capableStaff = data.staff.find((st: any) => st.services.some((srv: any) => srv.id === firstService.id));
        if (capableStaff) defaultStaff = capableStaff.id;
      }
      setSelectedStaffId(defaultStaff);
    } else {
      setInitialLoad(false);
      setDateError("Nessun servizio configurato per questo negozio.");
    }
    setLoadingTenant(false);
  }, [initialData]);`;

content = content.replace(fetchEffect, newEffect);

// 3. Fix params.slug to slug
content = content.replace(/params\.slug/g, "slug");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("BookingClient.tsx refactored successfully.");
