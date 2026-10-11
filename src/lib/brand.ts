// Rename the product in one place.
export const BRAND = {
  name: "StepPay",
  tagline: "The sandbox payment gateway for IT Step Academy",
  sdkGlobal: "StepPay",
  bankName: "StepBank", // fake card issuer shown on the 3-D Secure page
  supportEmail: "",
};

export const CURRENCIES = ["GEL", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOL: Record<string, string> = { GEL: "₾", USD: "$", EUR: "€" };
