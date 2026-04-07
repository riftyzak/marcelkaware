export const ticketStatuses = [
  "open",
  "staffWaiting",
  "userWaiting",
  "resolved",
  "closed",
] as const;

export const ticketPriorities = ["normal", "high"] as const;

export const ticketCategories = [
  "general",
  "technical",
  "billing",
  "account",
] as const;

export const ticketReplyActorRoles = [
  "registered",
  "activeSubscriber",
  "expiredSubscriber",
  "moderator",
  "supportStaff",
  "admin",
] as const;

export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketPriority = (typeof ticketPriorities)[number];
export type TicketCategory = (typeof ticketCategories)[number];
export type TicketReplyActorRole = (typeof ticketReplyActorRoles)[number];
