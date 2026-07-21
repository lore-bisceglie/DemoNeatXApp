import os
import re

filepath = r"app/t/[slug]/BookingClient.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace hook signature
content = content.replace(
    "export default function TenantPage(props: { params: Promise<{ slug: string }> }) {\n  const params = use(props.params);",
    "export function BookingClient({ slug, initialData }: { slug: string, initialData: any }) {"
)

# Extract useEffect
start_str = "  useEffect(() => {\n    fetch(`/api/tenant/${params.slug}`)"
start_idx = content.find(start_str)
end_str = "  }, [params.slug]);"
end_idx = content.find(end_str) + len(end_str)

if start_idx != -1 and end_idx != -1:
    effect_code = content[start_idx:end_idx]
    new_effect = """  useEffect(() => {
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
      mapsLink: data.mapsLink || (data.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}` : ""),
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
  }, [initialData]);"""
    
    content = content.replace(effect_code, new_effect)

content = content.replace("params.slug", "slug")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("BookingClient.tsx refactored!")
