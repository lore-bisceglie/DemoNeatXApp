export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type StaffMember = {
  id: string;
  name: string;
  services: { id: string }[];
};

export type TenantInfo = {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
  closedDays: number[];
  instagramUrl: string;
  mapsLink: string;
  isDemo: boolean;
  trialExpired: boolean;
  isPremium: boolean;
  staff: StaffMember[];
};

export type BookingResult = {
  cancelToken: string;
  date: string;
  time: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  paymentLabel: string;
  price: number;
};

export type StepId = "service" | "staff" | "datetime" | "details" | "confirm";
