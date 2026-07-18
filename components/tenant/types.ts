export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  locations?: { locationId: string; price?: number | null }[];
};

export type PublicLocation = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  closedDays?: string | null;
  mapsLink?: string | null;
  isMain: boolean;
  isActive: boolean;
  settings?: {
    paymentStrategy: string;
    paymentFixedAmount: number | null;
    paymentPercentage: number | null;
    paymentMandatory: boolean;
    stripeConnected?: boolean;
    stripeOnboardingComplete?: boolean;
  } | null;
};

export type PublicStaffMember = {
  id: string;
  name: string;
  services: Pick<Service, 'id' | 'name' | 'duration' | 'price'>[];
  locations: { locationId: string }[];
  locationId?: string | null;
};

export type ThemeConfig = {
  mainHex: string;
  btnBg: string;
  textMain: string;
  textHover: string;
  borderMain: string;
  shadowMain: string;
  avatarShadow: string;
  badgeBg: string;
  selection: string;
};

export type TenantInfoType = {
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
  tiktokUrl: string;
  bookingUrl: string;
  trialEndsAt: string;
  isDemo: boolean;
  trialExpired: boolean;
  trialStatus: string;
  category: string;
  description: string;
  city: string;
  isPremium: boolean;
  staff: PublicStaffMember[];
  logoUrl: string;
  themeColor: string;
  storeSettings: {
    paymentStrategy: string;
    paymentFixedAmount: number | null;
    paymentPercentage: number | null;
    paymentMandatory: boolean;
    stripeConnected?: boolean;
    stripeOnboardingComplete?: boolean;
  } | null;
};

export type BookingInitialData = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closedDays: string | null;
  instagramUrl: string | null;
  mapsLink: string | null;
  tiktokUrl: string | null;
  bookingUrl: string | null;
  trialEndsAt: string;
  isDemoData: boolean;
  trialExpired: boolean;
  trialStatus: string;
  category: string;
  description: string | null;
  city: string | null;
  isPremium: boolean;
  logoUrl: string | null;
  themeColor: string;
  services: Service[];
  staff: PublicStaffMember[];
  locations: PublicLocation[];
  storeSettings: TenantInfoType["storeSettings"];
};
