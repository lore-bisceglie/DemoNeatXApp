export const DEMO_DEPOSIT = { price: 5, priceCents: 500, label: "Acconto prenotazione" };
export const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";
export const DEMO_PHONE_NUMBER = "393406834163";
export const DEMO_STANDARD_SERVICE = { name: "Taglio Capelli", duration: 30, price: 15 };

export function isLunchSlot(time: string): boolean {
  // Gli orari in cui il taglio costa 20€
  return ["12:00", "12:30", "13:00", "13:30"].includes(time);
}

export function getDemoServiceForTime(time: string) {
  if (isLunchSlot(time)) {
    return { name: "Taglio Pausa Pranzo", duration: 30, price: 20 };
  }
  return DEMO_STANDARD_SERVICE;
}

export function getDemoBalanceDue(time: string) {
  const service = getDemoServiceForTime(time);
  return service.price - DEMO_DEPOSIT.price;
}