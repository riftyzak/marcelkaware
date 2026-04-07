export const announcementAudienceScopes = [
  "public",
  "members",
  "subscribers",
  "staff",
] as const;

export const bannerSeverityLevels = [
  "info",
  "success",
  "warning",
  "critical",
] as const;

export const bannerAudienceScopes = [
  "public",
  "authenticated",
  "subscribers",
  "staff",
] as const;

export const badgeStyleVariants = [
  "neutral",
  "cyan",
  "emerald",
  "amber",
  "rose",
  "violet",
] as const;

export const changelogEntryTypes = [
  "added",
  "improved",
  "fixed",
  "knownIssues",
] as const;

export const homepageBlockTypes = [
  "heroSupportText",
  "trustStrip",
  "featureRow",
  "faqRow",
  "ctaBlock",
] as const;

export type AnnouncementAudienceScope = (typeof announcementAudienceScopes)[number];
export type BannerSeverityLevel = (typeof bannerSeverityLevels)[number];
export type BannerAudienceScope = (typeof bannerAudienceScopes)[number];
export type BadgeStyleVariant = (typeof badgeStyleVariants)[number];
export type ChangelogEntryType = (typeof changelogEntryTypes)[number];
export type HomepageBlockType = (typeof homepageBlockTypes)[number];
