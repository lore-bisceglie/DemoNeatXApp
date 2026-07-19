import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const base = "https://www.neatx.store/api/availability";

try {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "green-beauty-bistagno" },
    select: {
      id: true,
      services: { orderBy: { duration: "asc" }, take: 1, select: { id: true, duration: true } },
      locations: { where: { isMain: true }, take: 1, select: { id: true } },
    },
  });
  assert.ok(tenant?.services[0] && tenant.locations[0]);
  const service = tenant.services[0];
  const location = tenant.locations[0];

  async function slots(date) {
    const params = new URLSearchParams({
      date,
      duration: String(service.duration),
      serviceId: service.id,
      tenantId: tenant.id,
      locationId: location.id,
    });
    const response = await fetch(`${base}?${params}`);
    assert.equal(response.status, 200);
    return response.json();
  }

  const sunday = await slots("2026-07-19");
  const monday = await slots("2026-07-20");
  const tuesday = await slots("2026-07-21");
  assert.equal(sunday.slots.length, 0);
  assert.equal(monday.slots.length, 0);
  assert.ok(tuesday.slots.length > 0);
  assert.ok(tuesday.slots.every((slot) => /^([01]\d|2[0-3]):[0-5]\d$/.test(slot)));

  console.log(JSON.stringify({
    sundaySlots: sunday.slots.length,
    mondaySlots: monday.slots.length,
    tuesdaySlots: tuesday.slots.length,
    firstTuesdaySlot: tuesday.slots[0],
    lastTuesdaySlot: tuesday.slots.at(-1),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
