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

export const ticketDepartments = [
  "technicalQuestions",
  "accountRecovery",
  "emailChange",
  "unbanRequest",
  "other",
] as const;

export const ticketReplyActorRoles = [
  "registered",
  "activeSubscriber",
  "expiredSubscriber",
  "moderator",
  "supportStaff",
  "admin",
] as const;

export const supportRequesterTypes = ["user", "guest"] as const;

export const guestTicketReplyActorRoles = ["guest", "supportStaff", "admin"] as const;

export const ticketRichTextFormats = ["plainText", "richText"] as const;

export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketPriority = (typeof ticketPriorities)[number];
export type TicketCategory = (typeof ticketCategories)[number];
export type TicketDepartment = (typeof ticketDepartments)[number];
export type TicketReplyActorRole = (typeof ticketReplyActorRoles)[number];
export type SupportRequesterType = (typeof supportRequesterTypes)[number];
export type GuestTicketReplyActorRole = (typeof guestTicketReplyActorRoles)[number];
export type TicketRichTextFormat = (typeof ticketRichTextFormats)[number];

export const supportStateKey = "global";

export const ticketDepartmentLabels: Record<TicketDepartment, string> = {
  technicalQuestions: "Technical questions",
  accountRecovery: "Account recovery",
  emailChange: "Email changing issues",
  unbanRequest: "Unban requests",
  other: "Other",
};

export const ticketDepartmentDescriptions: Record<TicketDepartment, string> = {
  technicalQuestions: "Launch issues, technical blockers, setup problems, or product questions.",
  accountRecovery: "Lost account access, recovery flow issues, or ownership verification problems.",
  emailChange: "Requests related to changing the account email or resolving email mismatches.",
  unbanRequest: "Ban reviews, restriction appeals, or moderation-related account requests.",
  other: "Anything that does not fit the other support departments.",
};

export function mapLegacyTicketCategoryToDepartment(category: TicketCategory): TicketDepartment {
  switch (category) {
    case "technical":
      return "technicalQuestions";
    case "account":
      return "accountRecovery";
    case "billing":
      return "other";
    case "general":
    default:
      return "other";
  }
}

export function mapDepartmentToLegacyTicketCategory(
  department: TicketDepartment,
): TicketCategory {
  switch (department) {
    case "technicalQuestions":
      return "technical";
    case "accountRecovery":
    case "emailChange":
    case "unbanRequest":
      return "account";
    case "other":
    default:
      return "general";
  }
}

export function buildCommunityTicketPath(ticketNumber: number) {
  return `/community/tickets/${ticketNumber}`;
}
