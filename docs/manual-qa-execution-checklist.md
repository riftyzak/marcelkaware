# Manual QA Execution Checklist

This checklist operationalizes [manual-qa-matrix.md](/C:/Users/riftyzak/Desktop/projekty/marcelkaware/docs/manual-qa-matrix.md) for beta readiness.

Source of truth:
- Current implementation in this repository
- [manual-qa-matrix.md](/C:/Users/riftyzak/Desktop/projekty/marcelkaware/docs/manual-qa-matrix.md)

## Pre-Run Setup

- Confirm the deployment under test is stable and points to the intended Convex environment.
- Confirm test payment providers are configured and webhook endpoints are reachable.
- Confirm seeded test accounts exist:
  - `registered`
  - `activeSubscriber`
  - `expiredSubscriber`
  - `moderator`
  - `supportStaff`
  - `adminOnly`
  - `adminSubscriber`
  - `banned`
- Confirm seeded content exists:
  - one guest-visible category
  - one registered-visible category
  - one subscriber-only category
  - one archived category
  - one open thread
  - one locked thread
  - one hidden thread
  - one hidden post in a visible thread
  - one ticket per key ownership scenario
  - one active Stripe-backed subscription
  - one active crypto-backed subscription
  - one expired subscription
- Confirm audit logs are enabled and readable by `adminOnly`.
- Confirm at least one reseller record and one test key batch exist for redemption tests.

## Execution Order

1. `P0` ban override and entitlement gating
2. `P0` purchase and webhook handling
3. `P0` downloads and launcher pairing
4. `P0` ticket ownership and staff boundaries
5. `P0` community visibility and profile leakage
6. `P0` deep-link access
7. `P0` launcher token lifecycle
8. `P0` audit log verification
9. `P1` moderation and admin operational checks
10. `P2` empty/loading/mobile polish checks

## P0 Core Checklist

### Ban Override

- [ ] Sign in as `banned`.
- [ ] Open `/app`, `/pricing`, `/app/downloads`, `/app/tickets`, `/community`.
- [ ] Attempt purchase and launcher pairing.
- [ ] Verify only contact/appeal flow remains available.

Expected result:
- Restricted state everywhere except the existing contact/appeal path.

### Purchase and Webhooks

- [ ] Start Stripe checkout as `registered`.
- [ ] Complete Stripe success path and verify active entitlement.
- [ ] Start crypto checkout as `registered`.
- [ ] Complete crypto confirmation path and verify active entitlement.
- [ ] Replay the same Stripe webhook.
- [ ] Replay the same crypto webhook.
- [ ] Simulate failed renewal for an active user.
- [ ] Simulate late or out-of-order webhook after status transition.
- [ ] Simulate Stripe chargeback/dispute path.

Expected result:
- Successful confirmations create or extend entitlement once.
- Duplicate webhooks are idempotent.
- Failed renewal expires paid access safely.
- Late webhooks do not corrupt state.
- Chargeback/dispute revokes paid access.

### Downloads and Pairing

- [ ] Open `/app/downloads` as `registered`, `expiredSubscriber`, `activeSubscriber`, `adminOnly`, `adminSubscriber`.
- [ ] Verify only currently entitled users can download.
- [ ] Generate pairing code as `activeSubscriber`.
- [ ] Exchange pairing code in launcher flow.
- [ ] Refresh launcher token and verify entitlement.

Expected result:
- Paid delivery stays tied to actual active entitlement, not staff/admin role alone.

### Ticket Ownership and Staff Boundaries

- [ ] Create, reply to, close, and reopen own ticket as `registered`.
- [ ] Open another user's ticket URL as `registered` and `activeSubscriber`.
- [ ] Open `/admin/tickets` as `supportStaff`, `adminOnly`, and `moderator`.
- [ ] Assign and status-change tickets as `supportStaff`.
- [ ] Confirm `banned` cannot access normal ticket flow.

Expected result:
- Ticket access is owner-only for normal users.
- Support/admin queue is restricted correctly.
- Banned users are forced to contact/appeal path only.

### Community Visibility and Leakage

- [ ] Open community index as `guest`, `registered`, `activeSubscriber`, `expiredSubscriber`, `supportStaff`, `moderator`, `adminOnly`, `banned`.
- [ ] Verify category visibility matches role policy.
- [ ] Open the same member profile under multiple viewer roles.
- [ ] Check that subscriber-only activity never leaks to lower-visibility viewers.
- [ ] Deep-link a hidden thread as `supportStaff`, `moderator`, `adminOnly`.

Expected result:
- Visibility boundaries hold at list, detail, and profile summary levels.

### Deep-Link Access

- [ ] Open `/app/downloads` directly for every role.
- [ ] Open `/app/tickets/[id]` directly for owner, non-owner, support, admin, banned.
- [ ] Open `/admin/tickets` directly for all staff and non-staff roles.
- [ ] Open `/community/c/[subscriber-category]` directly for every role.
- [ ] Open `/community/t/[hidden-thread]` directly for every role.
- [ ] Open `/members/[handle]` directly for every role.

Expected result:
- Direct entry never bypasses navigation-based restrictions.

### Launcher Token Lifecycle

- [ ] Attempt pairing code reuse.
- [ ] Attempt expired pairing code exchange.
- [ ] Attempt revoked refresh token reuse.
- [ ] Attempt parallel refresh if supported by the client.
- [ ] Refresh after HWID reset.
- [ ] Refresh after support-side/session revocation.
- [ ] Refresh after entitlement expiry and after ban.

Expected result:
- Pairing and refresh flows are revocable, scoped, device-aware, and fail cleanly when invalid.

### Audit Log Verification

- [ ] Assign a ticket and verify audit entry.
- [ ] Close and reopen ticket as staff and verify audit entry.
- [ ] Hide, restore, lock, and pin forum content and verify audit entries.
- [ ] Publish/unpublish announcement, changelog, banner, and homepage block and verify audit entries.
- [ ] Assign and remove badge and verify audit entries.
- [ ] Generate, issue, redeem, and revoke reseller keys and verify audit entries.
- [ ] Change account state if supported in current admin tools and verify audit entry.

Expected result:
- Sensitive operational actions create clear, queryable audit rows with actor and target context.

## P1 / P2 Checklist

- [ ] Validate locked, archived, hidden, resolved, and closed states across support and community surfaces.
- [ ] Validate confirmation UX for destructive admin actions.
- [ ] Validate loading, empty, forbidden, and error states in admin pages.
- [ ] Validate mobile behavior for dashboard, admin lists, ticket detail, community thread, and profile pages.
- [ ] Validate internal shortcut navigation and breadcrumb clarity.

## Run Completion

- [ ] File every issue using [bug-triage-template.md](/C:/Users/riftyzak/Desktop/projekty/marcelkaware/docs/bug-triage-template.md).
- [ ] Mark each matrix section as pass, pass with notes, blocked, or failed.
- [ ] Re-run all impacted `P0` scenarios after each fix.
- [ ] Do not advance to beta launch until all open `P0` items are closed.
