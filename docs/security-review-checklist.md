# Security Review Checklist

This checklist is focused on the implemented platform boundaries, not hypothetical future systems.

## Auth and RBAC

- [ ] Confirm all privileged Convex functions enforce server-side access checks.
- [ ] Confirm no admin, support, moderation, or reseller action depends on client-only gating.
- [ ] Confirm banned state overrides normal purchase, download, ticket, community, and launcher behavior.
- [ ] Confirm mixed-role accounts do not accidentally inherit subscriber-only access unless explicitly entitled.
- [ ] Confirm admin-only routes reject non-admin users even on deep-link access.

## Deep-Link Access

- [ ] Open direct URLs for downloads, ticket details, admin ticket queue, subscriber-only category, hidden thread, and member profiles under every role.
- [ ] Confirm deep-link access matches normal navigation restrictions.
- [ ] Confirm forbidden routes return safe unavailable states and do not leak data in rendered content.

## Entitlement, Downloads, and Pairing

- [ ] Confirm downloads require active entitlement on the server.
- [ ] Confirm launcher pairing requires active entitlement on the server.
- [ ] Confirm pairing does not reuse browser session tokens directly.
- [ ] Confirm launcher access tokens and refresh tokens are revocable and scoped.
- [ ] Confirm entitlement refresh fails after ban, expiry, revocation, or invalid device state.
- [ ] Confirm download links or delivery endpoints do not expose files to non-entitled users.

## Profile and Community Visibility Leakage

- [ ] Confirm guest, registered, expired, and subscriber viewers each see only allowed category activity on public profiles.
- [ ] Confirm hidden threads and hidden posts do not leak through profile summaries or counts.
- [ ] Confirm subscriber-only categories do not leak via community summaries, counts, or profile excerpts.
- [ ] Confirm support staff visibility matches current policy and does not implicitly include moderation visibility.

## Ticket Ownership and Staff Boundaries

- [ ] Confirm normal users can only access their own tickets.
- [ ] Confirm support/admin can access staff queue and ticket detail.
- [ ] Confirm moderator cannot access staff queue unless explicitly granted elsewhere.
- [ ] Confirm banned users cannot access normal ticket creation or reply flows.
- [ ] Confirm ticket detail views do not leak replies or metadata to unauthorized users.

## Payment, Webhooks, and State Handling

- [ ] Confirm Stripe webhook signature verification is enforced in Node runtime only.
- [ ] Confirm hosted crypto confirmation verification is enforced in Node runtime only.
- [ ] Confirm duplicate webhook delivery is idempotent.
- [ ] Confirm renewal failure expires entitlement correctly.
- [ ] Confirm late or out-of-order webhook delivery does not corrupt state.
- [ ] Confirm dispute/chargeback handling revokes paid access safely.

## Reseller Key Generation, Redemption, and Revocation

- [ ] Confirm key generation uses secure random generation in Node runtime only.
- [ ] Confirm raw key material is not broadly exposed after issuance.
- [ ] Confirm stored key representation is hashed or otherwise safely represented.
- [ ] Confirm duplicate redemption fails safely.
- [ ] Confirm revoked keys fail safely.
- [ ] Confirm banned users cannot redeem reseller keys.
- [ ] Confirm redemption creates, extends, or reactivates subscriptions correctly without duplicate entitlements.

## Audit Log Coverage

- [ ] Confirm audit rows exist for ticket assignment and lifecycle changes.
- [ ] Confirm audit rows exist for forum moderation actions.
- [ ] Confirm audit rows exist for announcement, changelog, banner, and homepage publish/unpublish changes.
- [ ] Confirm audit rows exist for badge assignment/removal and definition changes.
- [ ] Confirm audit rows exist for reseller creation, batch generation, issuance, redemption, and revocation.
- [ ] Confirm audit rows exist for account-state changes and any staff subscription-impacting action.
- [ ] Confirm audit log visibility is admin-only.

## Final Sign-Off

- [ ] No open `P0` security issues.
- [ ] All reviewed boundaries have an explicit pass/fail result.
- [ ] Any accepted `P1` risk has a documented mitigation and owner.
