// Central place for business identity and operator details. The defaults below
// are clearly labelled demo placeholders; replace them before a live launch.
const env = import.meta.env;

export const SITE = {
  name: (env.VITE_BUSINESS_NAME as string | undefined) ?? "SeatSwift",
  tagline: "Smart bus seat reservation",
  contact: {
    email: (env.VITE_CONTACT_EMAIL as string | undefined) ?? "hello@seatswift.example",
    phone: (env.VITE_CONTACT_PHONE as string | undefined) ?? "+94 11 555 0100",
    address: (env.VITE_CONTACT_ADDRESS as string | undefined) ?? "Colombo, Sri Lanka",
  },
  // Bank-transfer instructions shown at the payment step. Fill in via env or here.
  bank: {
    bankName: (env.VITE_BANK_NAME as string | undefined) ?? "",
    accountName: (env.VITE_BANK_ACCOUNT_NAME as string | undefined) ?? "",
    accountNumber: (env.VITE_BANK_ACCOUNT_NUMBER as string | undefined) ?? "",
    branch: (env.VITE_BANK_BRANCH as string | undefined) ?? "",
  },
  maxSeatsPerBooking: 6,
} as const;
