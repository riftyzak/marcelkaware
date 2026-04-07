export const paymentProviders = ["stripe", "crypto"] as const;
export const paymentStatuses = [
  "pending",
  "confirmed",
  "failed",
  "expired",
  "refunded",
  "chargeback",
  "canceled",
] as const;

export type PaymentProvider = (typeof paymentProviders)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
