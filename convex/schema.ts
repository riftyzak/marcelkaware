import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(
      v.union(
        v.literal("registered"),
        v.literal("moderator"),
        v.literal("supportStaff"),
        v.literal("admin"),
        v.literal("resellerOps"),
      ),
    ),
    accountState: v.optional(
      v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
    ),
    displayName: v.optional(v.string()),
    handle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    banReason: v.optional(v.string()),
    bannedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("handle", ["handle"])
    .index("role", ["role"])
    .index("accountState", ["accountState"]),
  authSessions: defineTable({
    userId: v.id("users"),
    expirationTime: v.number(),
  }).index("userId", ["userId"]),
  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),
  authRefreshTokens: defineTable({
    sessionId: v.id("authSessions"),
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", [
      "sessionId",
      "parentRefreshTokenId",
    ]),
  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    provider: v.string(),
    code: v.string(),
    expirationTime: v.number(),
    verifier: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),
  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),
  authRateLimits: defineTable({
    identifier: v.string(),
    lastAttemptTime: v.number(),
    attemptsLeft: v.number(),
  }).index("identifier", ["identifier"]),
  subscriptions: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("none"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("pastDue"),
      v.literal("expired"),
      v.literal("canceled"),
      v.literal("revoked"),
    ),
    provider: v.optional(v.union(v.literal("stripe"), v.literal("crypto"))),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    lastPaymentId: v.optional(v.id("payments")),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("providerSubscriptionId", ["providerSubscriptionId"]),
  payments: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("stripe"), v.literal("crypto")),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("refunded"),
      v.literal("chargeback"),
      v.literal("canceled"),
    ),
    amountCents: v.number(),
    currency: v.string(),
    providerEventId: v.optional(v.string()),
    providerPaymentId: v.optional(v.string()),
    providerCheckoutId: v.optional(v.string()),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    confirmedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("providerEventId", ["providerEventId"])
    .index("providerPaymentId", ["providerPaymentId"])
    .index("providerCheckoutId", ["providerCheckoutId"]),
  paymentEvents: defineTable({
    provider: v.union(v.literal("stripe"), v.literal("crypto")),
    eventId: v.string(),
    eventType: v.string(),
    payloadDigest: v.optional(v.string()),
    processedAt: v.number(),
    rawPreview: v.optional(v.string()),
  })
    .index("providerAndEventId", ["provider", "eventId"])
    .index("processedAt", ["processedAt"]),
  cryptoCheckoutRefs: defineTable({
    reference: v.string(),
    userId: v.id("users"),
    returnUrl: v.string(),
    createdAt: v.number(),
  })
    .index("reference", ["reference"])
    .index("userId", ["userId"]),
  tickets: defineTable({
    userId: v.id("users"),
    createdByUserId: v.id("users"),
    subject: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("staffWaiting"),
      v.literal("userWaiting"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    priority: v.union(v.literal("normal"), v.literal("high")),
    category: v.union(
      v.literal("general"),
      v.literal("technical"),
      v.literal("billing"),
      v.literal("account"),
    ),
    assignedToUserId: v.optional(v.id("users")),
    latestReplyAt: v.number(),
    latestReplyByUserId: v.optional(v.id("users")),
    closedAt: v.optional(v.number()),
    closedByUserId: v.optional(v.id("users")),
    reopenedAt: v.optional(v.number()),
    visibleToUser: v.boolean(),
    visibleToStaff: v.boolean(),
    subscriptionSnapshot: v.object({
      status: v.union(
        v.literal("none"),
        v.literal("pending"),
        v.literal("active"),
        v.literal("pastDue"),
        v.literal("expired"),
        v.literal("canceled"),
        v.literal("revoked"),
      ),
      accessTier: v.union(
        v.literal("guest"),
        v.literal("registered"),
        v.literal("activeSubscriber"),
        v.literal("expiredSubscriber"),
        v.literal("moderator"),
        v.literal("supportStaff"),
        v.literal("admin"),
        v.literal("resellerOps"),
        v.literal("banned"),
      ),
      renewalAt: v.optional(v.number()),
    }),
    accountSnapshot: v.object({
      accountState: v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("banned"),
      ),
      role: v.union(
        v.literal("registered"),
        v.literal("moderator"),
        v.literal("supportStaff"),
        v.literal("admin"),
        v.literal("resellerOps"),
      ),
      activeDeviceCount: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("assignedToUserId", ["assignedToUserId"])
    .index("latestReplyAt", ["latestReplyAt"]),
  ticketReplies: defineTable({
    ticketId: v.id("tickets"),
    authorUserId: v.id("users"),
    authorRole: v.union(
      v.literal("registered"),
      v.literal("activeSubscriber"),
      v.literal("expiredSubscriber"),
      v.literal("moderator"),
      v.literal("supportStaff"),
      v.literal("admin"),
    ),
    body: v.string(),
    isInternalNote: v.boolean(),
    createdAt: v.number(),
  })
    .index("ticketId", ["ticketId"])
    .index("authorUserId", ["authorUserId"]),
  forumCategories: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
    visibleToGuests: v.boolean(),
    visibleToRegisteredUsers: v.boolean(),
    visibleToActiveSubscribers: v.boolean(),
    allowThreads: v.boolean(),
    allowReplies: v.boolean(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("sortOrder", ["sortOrder"]),
  forumThreads: defineTable({
    categoryId: v.id("forumCategories"),
    authorUserId: v.id("users"),
    title: v.string(),
    status: v.union(v.literal("open"), v.literal("locked"), v.literal("hidden")),
    isPinned: v.boolean(),
    replyCount: v.number(),
    reactionCount: v.number(),
    lastPostAt: v.number(),
    lastPostUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("categoryId", ["categoryId"])
    .index("authorUserId", ["authorUserId"])
    .index("lastPostAt", ["lastPostAt"])
    .index("status", ["status"]),
  forumPosts: defineTable({
    threadId: v.id("forumThreads"),
    categoryId: v.id("forumCategories"),
    authorUserId: v.id("users"),
    body: v.string(),
    status: v.union(v.literal("visible"), v.literal("hidden")),
    reactionCount: v.number(),
    editedAt: v.optional(v.number()),
    hiddenAt: v.optional(v.number()),
    hiddenByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("threadId", ["threadId"])
    .index("authorUserId", ["authorUserId"])
    .index("categoryId", ["categoryId"])
    .index("status", ["status"]),
  forumReactions: defineTable({
    postId: v.id("forumPosts"),
    threadId: v.id("forumThreads"),
    userId: v.id("users"),
    kind: v.union(v.literal("like")),
    createdAt: v.number(),
  })
    .index("postId", ["postId"])
    .index("userId", ["userId"])
    .index("postIdAndUserId", ["postId", "userId"]),
  announcements: defineTable({
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    body: v.string(),
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    audienceScope: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("subscribers"),
      v.literal("staff"),
    ),
    pinned: v.boolean(),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("published", ["published"])
    .index("publishedAt", ["publishedAt"])
    .index("pinned", ["pinned"]),
  changelogs: defineTable({
    version: v.string(),
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    entries: v.array(
      v.object({
        type: v.union(
          v.literal("added"),
          v.literal("improved"),
          v.literal("fixed"),
          v.literal("knownIssues"),
        ),
        body: v.string(),
      }),
    ),
    releasedAt: v.number(),
    published: v.boolean(),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("published", ["published"])
    .index("releasedAt", ["releasedAt"]),
  siteBanners: defineTable({
    slug: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("critical"),
    ),
    message: v.string(),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    audienceScope: v.union(
      v.literal("public"),
      v.literal("authenticated"),
      v.literal("subscribers"),
      v.literal("staff"),
    ),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("published", ["published"])
    .index("publishedAt", ["publishedAt"]),
  homepageBlocks: defineTable({
    slug: v.string(),
    type: v.union(
      v.literal("heroSupportText"),
      v.literal("trustStrip"),
      v.literal("featureRow"),
      v.literal("faqRow"),
      v.literal("ctaBlock"),
    ),
    label: v.string(),
    sortOrder: v.number(),
    published: v.boolean(),
    data: v.union(
      v.object({
        type: v.literal("heroSupportText"),
        eyebrow: v.optional(v.string()),
        title: v.string(),
        body: v.string(),
        primaryLabel: v.string(),
        primaryHref: v.string(),
        secondaryLabel: v.optional(v.string()),
        secondaryHref: v.optional(v.string()),
      }),
      v.object({
        type: v.literal("trustStrip"),
        items: v.array(v.string()),
      }),
      v.object({
        type: v.literal("featureRow"),
        title: v.string(),
        intro: v.optional(v.string()),
        features: v.array(
          v.object({
            title: v.string(),
            body: v.string(),
          }),
        ),
      }),
      v.object({
        type: v.literal("faqRow"),
        title: v.string(),
        items: v.array(
          v.object({
            question: v.string(),
            answer: v.string(),
          }),
        ),
      }),
      v.object({
        type: v.literal("ctaBlock"),
        title: v.string(),
        body: v.string(),
        primaryLabel: v.string(),
        primaryHref: v.string(),
        secondaryLabel: v.optional(v.string()),
        secondaryHref: v.optional(v.string()),
      }),
    ),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("sortOrder", ["sortOrder"])
    .index("published", ["published"]),
  badges: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    styleVariant: v.union(
      v.literal("neutral"),
      v.literal("cyan"),
      v.literal("emerald"),
      v.literal("amber"),
      v.literal("rose"),
      v.literal("violet"),
    ),
    iconKey: v.optional(v.string()),
    published: v.boolean(),
    sortOrder: v.number(),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("sortOrder", ["sortOrder"])
    .index("published", ["published"]),
  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    assignedByUserId: v.id("users"),
    assignedAt: v.number(),
    internalNote: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("badgeId", ["badgeId"])
    .index("userIdAndBadgeId", ["userId", "badgeId"]),
  resellers: defineTable({
    name: v.string(),
    slug: v.string(),
    contactName: v.string(),
    contactHandleOrEmail: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
    notes: v.optional(v.string()),
    createdByUserId: v.id("users"),
    updatedByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("status", ["status"]),
  resellerKeyBatches: defineTable({
    resellerId: v.id("resellers"),
    batchRef: v.string(),
    durationDays: v.number(),
    quantity: v.number(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("completed"),
      v.literal("revoked"),
    ),
  })
    .index("resellerId", ["resellerId"])
    .index("batchRef", ["batchRef"])
    .index("status", ["status"]),
  resellerKeys: defineTable({
    batchId: v.id("resellerKeyBatches"),
    lookupPrefix: v.string(),
    keyPreview: v.string(),
    keyHash: v.string(),
    status: v.union(
      v.literal("unissued"),
      v.literal("issued"),
      v.literal("redeemed"),
      v.literal("revoked"),
    ),
    assignedResellerId: v.id("resellers"),
    redeemedByUserId: v.optional(v.id("users")),
    redeemedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    internalNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("batchId", ["batchId"])
    .index("assignedResellerId", ["assignedResellerId"])
    .index("lookupPrefix", ["lookupPrefix"])
    .index("status", ["status"]),
  downloads: defineTable({
    slug: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    version: v.string(),
    platform: v.string(),
    downloadUrl: v.string(),
    checksumSha256: v.optional(v.string()),
    isPublished: v.boolean(),
    requiresActiveSubscription: v.boolean(),
    publishedAt: v.number(),
    createdAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("publishedAt", ["publishedAt"])
    .index("isPublished", ["isPublished"]),
  launcherPairingChallenges: defineTable({
    userId: v.id("users"),
    codeHash: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("codeHash", ["codeHash"])
    .index("userId", ["userId"]),
  launcherDevices: defineTable({
    userId: v.id("users"),
    deviceName: v.string(),
    deviceId: v.string(),
    hardwareFingerprintHash: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    lastIpHash: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("revoked")),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("deviceId", ["deviceId"])
    .index("hardwareFingerprintHash", ["hardwareFingerprintHash"]),
  launcherSessions: defineTable({
    userId: v.id("users"),
    deviceId: v.id("launcherDevices"),
    accessTokenHash: v.string(),
    refreshTokenHash: v.string(),
    scope: v.array(v.string()),
    accessExpiresAt: v.number(),
    refreshExpiresAt: v.number(),
    lastValidatedAt: v.optional(v.number()),
    createdAt: v.number(),
    rotatedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),
  })
    .index("accessTokenHash", ["accessTokenHash"])
    .index("refreshTokenHash", ["refreshTokenHash"])
    .index("userId", ["userId"])
    .index("deviceId", ["deviceId"]),
  ipLogs: defineTable({
    userId: v.optional(v.id("users")),
    source: v.union(v.literal("web"), v.literal("launcher"), v.literal("paymentWebhook")),
    ipHash: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("source", ["source"]),
  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    actorType: v.union(
      v.literal("user"),
      v.literal("staff"),
      v.literal("system"),
      v.literal("webhook"),
      v.literal("launcher"),
    ),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("createdAt", ["createdAt"]),
});
