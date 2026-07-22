export const appointmentManagementSelect = {
  id: true,
  date: true,
  time: true,
  customerName: true,
  tenantId: true,
  locationId: true,
  serviceId: true,
  staffId: true,
  cancelToken: true,
  service: { select: { name: true } },
} as const;
