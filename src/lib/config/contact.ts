const fallbackContactEmail = "legal@marcelkaware.dev";

export const contactConfig = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || fallbackContactEmail,
};

export const contactMailto = `mailto:${contactConfig.email}`;
