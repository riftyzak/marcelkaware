# Manual QA Matrix

## Status

This document freezes the current manual QA specification before Phase 3 work.

Source of truth:
- Current Next.js + Convex implementation
- Current Phase 1 and Phase 2 features
- Current UX cleanup and permission-state hardening

This file is intentionally based on implemented behavior, not future intent.

## Scope

Covered roles:
- `guest`
- `registered`
- `activeSubscriber`
- `expiredSubscriber`
- `moderator`
- `supportStaff`
- `adminOnly`
- `adminSubscriber`
- `banned`

Covered areas:
- auth/session behavior
- pricing/purchase
- subscriptions/account visibility
- downloads
- launcher pairing and entitlement
- tickets
- community visibility
- threads/posts/reactions
- moderation
- profile visibility and leakage
- forbidden-state UX
- payments/webhooks
- deep-link access
- launcher token lifecycle
- audit-log verification

## Current Policy Notes

These are not assumptions. They reflect the current implementation and should remain explicit during QA:

1. `banned` overrides community, ticket, download, purchase, and launcher entitlement behavior.
2. `banned` users retain only the existing contact and appeal path.
3. Only `activeSubscriber` receives gated downloads and launcher pairing entitlement.
4. `adminOnly`, `supportStaff`, and `moderator` do not automatically receive download or launcher entitlement unless they are also explicitly subscribed.
5. `supportStaff` can broadly view visible categories and post/reply in community where rules allow, but cannot moderate threads or posts.
6. Hidden community content is visible only to `moderator` and `admin`.
7. Public profiles must not leak subscriber-only or otherwise non-visible activity to lower-visibility viewers.

## Seed Data

Create or seed these accounts before running the matrix:

- `guest` (not signed in)
- `registered`
- `activeSubscriber`
- `expiredSubscriber`
- `moderator`
- `supportStaff`
- `adminOnly`
- `adminSubscriber`
- `banned`

Recommended optional future accounts:
- `supportSubscriber`
- `moderatorSubscriber`

Required content fixtures:
- one guest-visible category
- one registered-visible category
- one subscriber-only category
- one archived category
- one normal open thread
- one locked thread
- one hidden thread
- one hidden post inside a visible thread
- one ticket owned by `registered`
- one ticket owned by `activeSubscriber`
- one resolved ticket
- one closed ticket
- one active Stripe-backed subscription
- one active crypto-backed subscription
- one expired subscription

## Suggested Execution Order

1. P0 entitlement and purchase checks
2. P0 support access and ticket ownership checks
3. P0 community visibility and profile leakage checks
4. P0 payments/webhooks checks
5. P0 deep-link access checks
6. P0 launcher token lifecycle checks
7. P0 audit-log verification for sensitive actions
8. P1 moderation and edge-state checks
9. P2 loading, empty, mobile, and UX consistency checks

## Highest-Risk Tests

Run these first:

| ID | Priority | Area | Roles | Test | Expected Result |
|---|---|---|---|---|---|
| HR-01 | P0 | Ban override | `banned` | Open pricing, dashboard, downloads, tickets, community, launcher pairing | Restricted state everywhere except contact/appeal path |
| HR-02 | P0 | Download gate | `registered`, `expiredSubscriber`, `activeSubscriber`, `adminOnly` | Open `/app/downloads` | Only `activeSubscriber` allowed |
| HR-03 | P0 | Ticket ownership | `registered`, `activeSubscriber` | Open another user's ticket deep link | Denied with safe unavailable state |
| HR-04 | P0 | Staff queue boundary | `supportStaff`, `adminOnly`, `moderator` | Open `/admin/tickets` | Support/admin allowed, moderator denied |
| HR-05 | P0 | Profile leakage | `guest`, `registered`, `expiredSubscriber`, `activeSubscriber` | View same member profile with mixed-visibility activity | Only activity visible to viewer is shown |
| HR-06 | P0 | Hidden content boundary | `supportStaff`, `moderator`, `adminOnly` | Deep-link hidden thread | Moderator/admin allowed, support denied |
| HR-07 | P0 | Payment idempotency | system | Replay same webhook | No duplicate payment or entitlement rows |
| HR-08 | P0 | Entitlement revocation | `activeSubscriber` -> expired/banned | Refresh launcher entitlement after status loss | Refresh/entitlement fails and access is revoked |

## Role Matrix

### Auth and Session

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | Visit public pages, `/app`, `/app/downloads`, `/app/tickets` | Public pages load; gated areas show sign-in or gated state | P0 |
| `registered` | Sign in, refresh session, revisit dashboard | Dashboard loads as registered user | P0 |
| `activeSubscriber` | Sign in and revisit dashboard | Dashboard shows active subscription state and pairing controls | P0 |
| `expiredSubscriber` | Sign in and revisit dashboard | Dashboard loads with expired tier and no gated entitlement | P0 |
| `moderator` | Sign in and revisit dashboard | Dashboard shows moderator tier, not subscriber tier | P1 |
| `supportStaff` | Sign in and revisit dashboard | Dashboard shows support tier, not subscriber tier | P1 |
| `adminOnly` | Sign in and revisit dashboard | Dashboard shows admin tier, not subscriber tier | P1 |
| `adminSubscriber` | Sign in and revisit dashboard | Dashboard shows admin tier; verify whether downloads/pairing still use access-tier rules | P0 |
| `banned` | Sign in and revisit dashboard | Dashboard loads with restricted state and appeal wording | P0 |

### Pricing and Purchase Visibility

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | Visit pricing and try to buy | Must register first; cannot begin checkout directly | P0 |
| `registered` | Start Stripe and crypto checkout | Checkout actions begin | P0 |
| `activeSubscriber` | Visit pricing and start checkout | Checkout can still begin | P1 |
| `expiredSubscriber` | Start checkout | Checkout actions begin | P0 |
| `moderator` | Start checkout | Checkout actions begin unless banned | P1 |
| `supportStaff` | Start checkout | Checkout actions begin unless banned | P1 |
| `adminOnly` | Start checkout | Checkout actions begin unless banned | P1 |
| `adminSubscriber` | Start checkout | Checkout actions begin | P1 |
| `banned` | Start Stripe and crypto checkout | Action fails cleanly; checkout does not start | P0 |

### Account and Subscription Visibility

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `registered` | Inspect dashboard widgets | Shows registered access, payments if any, no download entitlement | P1 |
| `activeSubscriber` | Inspect dashboard widgets | Shows active renewal and active launcher access | P0 |
| `expiredSubscriber` | Inspect dashboard widgets | Shows expired access and no launcher/download entitlement | P0 |
| `adminOnly` | Inspect dashboard widgets | Admin tools available, but no paid delivery unless separately subscribed | P0 |
| `adminSubscriber` | Inspect dashboard widgets | Verify mixed-role behavior is intentional and consistent | P0 |
| `banned` | Inspect dashboard widgets | Restricted banner and disabled paid flows | P0 |

### Downloads

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | Open downloads route directly | Denied; sign-in/gating state | P0 |
| `registered` | Open downloads route | Denied; active subscription required | P0 |
| `activeSubscriber` | Open downloads route and use download link | Published gated downloads visible and downloadable | P0 |
| `expiredSubscriber` | Open downloads route | Denied; active subscription required | P0 |
| `moderator` | Open downloads route | Denied in current implementation | P0 |
| `supportStaff` | Open downloads route | Denied in current implementation | P0 |
| `adminOnly` | Open downloads route | Denied in current implementation | P0 |
| `adminSubscriber` | Open downloads route | Expected result depends on current access-tier logic; verify actual behavior explicitly | P0 |
| `banned` | Open downloads route | Denied with restricted account message | P0 |

### Launcher Pairing and Entitlement

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `registered` | Generate pairing code | Fails: active subscription required | P0 |
| `activeSubscriber` | Generate pairing code, exchange, refresh, entitlement check | Success end to end | P0 |
| `expiredSubscriber` | Generate pairing code | Fails: active subscription required | P0 |
| `moderator` | Generate pairing code | Fails in current implementation unless also truly entitled | P0 |
| `supportStaff` | Generate pairing code | Fails in current implementation unless also truly entitled | P0 |
| `adminOnly` | Generate pairing code | Fails in current implementation unless also truly entitled | P0 |
| `adminSubscriber` | Generate pairing code | Verify mixed-role behavior explicitly | P0 |
| `banned` | Generate pairing code | Fails: restricted accounts cannot pair devices | P0 |

### Tickets

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | Open ticket list/new/detail URLs | Denied | P0 |
| `registered` | Create own ticket, view own ticket, reply, close, reopen | Allowed on own tickets | P0 |
| `activeSubscriber` | Same as registered | Allowed on own tickets | P0 |
| `expiredSubscriber` | Same as registered | Allowed on own tickets | P0 |
| `moderator` | Open own ticket routes and try staff queue | Own ticket access only; staff queue denied | P0 |
| `supportStaff` | Open queue, view ticket, assign, change lifecycle, internal note | Allowed | P0 |
| `adminOnly` | Same as support plus admin account-state actions elsewhere | Allowed | P0 |
| `adminSubscriber` | Same as adminOnly | Allowed | P1 |
| `banned` | Ticket list/new/detail | Denied; contact/appeal path only | P0 |

### Community Visibility

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | Community index, public category, member profile | Guest-visible categories only; profile shows only guest-visible activity | P0 |
| `registered` | Community index and categories | Guest + registered categories only | P0 |
| `activeSubscriber` | Community index and categories | Guest + registered + subscriber categories | P0 |
| `expiredSubscriber` | Community index and categories | Guest + registered categories only | P0 |
| `moderator` | Community index and all categories | All categories visible | P0 |
| `supportStaff` | Community index and all categories | All categories visible in current implementation | P0 |
| `adminOnly` | Community index and all categories | All categories visible | P0 |
| `adminSubscriber` | Community index and all categories | All categories visible | P1 |
| `banned` | Community index/category/profile | Denied | P0 |

### Threads, Replies, Reactions

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | Create thread, reply, react | All denied | P0 |
| `registered` | Create/reply in allowed registered category, react on visible posts | Allowed only where category flags permit | P0 |
| `activeSubscriber` | Create/reply/react in subscriber category | Allowed where category flags permit | P0 |
| `expiredSubscriber` | Create/reply/react in subscriber category | Denied in subscriber-only spaces | P0 |
| `moderator` | Create/reply in locked and archived content | Allowed per current implementation | P1 |
| `supportStaff` | Create/reply in visible categories, including locked/archived bypass | Allowed per current implementation | P1 |
| `adminOnly` | Create/reply broadly | Allowed | P1 |
| `banned` | Create/reply/react | Denied | P0 |

### Moderation

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `moderator` | Hide/restore posts, lock/hide/pin threads | Allowed | P0 |
| `supportStaff` | Attempt same moderation actions | Denied in current implementation | P0 |
| `adminOnly` | Hide/restore posts, lock/hide/pin threads, forum category admin | Allowed | P0 |
| `adminSubscriber` | Same as adminOnly | Allowed | P1 |
| all others | Attempt moderation actions directly | Denied | P0 |

### Profiles and Leakage

| Role | Tests | Expected Result | Priority |
|---|---|---|---|
| `guest` | View member profile with mixed visibility activity | Only guest-visible activity appears | P0 |
| `registered` | Same profile | Guest + registered activity only | P0 |
| `activeSubscriber` | Same profile | Guest + registered + subscriber activity that is visible to this user | P0 |
| `expiredSubscriber` | Same profile | Guest + registered only | P0 |
| `supportStaff` | View member profile | Visible content only; hidden-thread activity should not leak through profile if implementation excludes it | P1 |
| `moderator` | View member profile | Visible profile data; verify hidden-thread behavior intentionally | P1 |
| `adminOnly` | View member profile | Visible profile data; no unexpected leakage beyond intended visibility | P1 |
| `banned` | Open member profile | Denied | P0 |

### Forbidden-State UX

| Area | Priority | Tests | Expected Result |
|---|---|---|---|
| Tickets | P1 | Open forbidden ticket or queue route | Safe unavailable/warning state, no crash, no leaked data |
| Community | P1 | Open forbidden category/thread/profile route | Safe unavailable/warning state, no leaked data |
| Downloads | P1 | Open downloads without entitlement | Clear denial state and next-step CTA |
| Pricing | P1 | Banned user tries checkout | Clean client-visible failure, no checkout redirect |
| Launcher | P1 | Non-entitled or banned user generates pairing code | Clear failure message |

## Payments and Webhooks

### P0 Payment-State Block

| ID | Priority | Test | Expected Result |
|---|---|---|---|
| PAY-01 | P0 | Successful Stripe checkout webhook | Payment row created; subscription becomes active; entitlement reflects active access |
| PAY-02 | P0 | Successful crypto confirmation webhook | Payment row created; subscription becomes active; entitlement reflects active access |
| PAY-03 | P0 | Replay exact same Stripe webhook | No duplicate payment event side effects; idempotent handling |
| PAY-04 | P0 | Replay exact same crypto webhook | No duplicate payment event side effects; idempotent handling |
| PAY-05 | P0 | Failed renewal event | Subscription state transitions away from active entitlement as implemented |
| PAY-06 | P0 | Late or out-of-order webhook after later state transition | Final persisted state is safe and coherent; no accidental regrant if current logic should prevent it |
| PAY-07 | P0 | Chargeback/dispute webhook | Paid access revoked correctly and safely |
| PAY-08 | P1 | Missing webhook signature | Request rejected with 400 |
| PAY-09 | P1 | Invalid webhook signature | Request rejected with 400 |

Note:
- Current QA should verify the actual persisted `payments`, `paymentEvents`, and `subscriptions` rows, not just UI changes.
- If an out-of-order webhook reveals a state-machine weakness, log it as a product-risk defect before Phase 3.

## Deep-Link Access Block

Test all of these by typing the URL directly, not by clicking through normal navigation:

| ID | Priority | Route | Roles | Expected Result |
|---|---|---|---|---|
| DL-01 | P0 | `/app/downloads` | all | Only active entitled role gets downloads |
| DL-02 | P0 | `/app/tickets/[id]` | owner, other user, support, admin, banned | Owner/staff allowed as implemented; others denied |
| DL-03 | P0 | `/admin/tickets` | support, admin, moderator, user | Support/admin allowed; others denied |
| DL-04 | P0 | `/community/c/[subscriber-category]` | guest, registered, active, expired, staff, banned | Visibility follows current category rules |
| DL-05 | P0 | `/community/t/[hidden-thread]` | moderator, admin, support, user | Moderator/admin only |
| DL-06 | P0 | `/members/[handle]` | all | Public profile visible only where community access allows |

## Launcher Token Lifecycle Block

| ID | Priority | Test | Expected Result |
|---|---|---|---|
| TOK-01 | P0 | Reuse pairing code after successful exchange | Rejected |
| TOK-02 | P0 | Use expired pairing code | Rejected |
| TOK-03 | P0 | Reuse revoked refresh token | Rejected |
| TOK-04 | P0 | Refresh after entitlement loss | Rejected and session revoked |
| TOK-05 | P0 | Refresh after ban | Rejected and session revoked |
| TOK-06 | P0 | Entitlement check with HWID mismatch | Rejected and session revoked |
| TOK-07 | P0 | Refresh after support-side session/device revocation | Rejected |
| TOK-08 | P1 | Concurrent refresh attempts on same token | Verify behavior is safe and deterministic |
| TOK-09 | P1 | Refresh after future HWID reset implementation | Should follow intended reset policy once implemented |

## Audit-Log Verification Block

Verify `auditLogs` rows are created for sensitive actions:

| ID | Priority | Action | Expected Result |
|---|---|---|---|
| AUD-01 | P0 | Ticket assignment | Audit log row created |
| AUD-02 | P0 | Ticket close by staff | Audit log row created |
| AUD-03 | P0 | Ticket reopen by staff | Audit log row created |
| AUD-04 | P0 | Thread lock/hide/pin | Audit log row created |
| AUD-05 | P0 | Post hide/restore | Audit log row created |
| AUD-06 | P0 | Ban/suspension via admin | Audit log row created |
| AUD-07 | P1 | Pairing challenge issued | Audit log row created |
| AUD-08 | P1 | Launcher session issued | Audit log row created |
| AUD-09 | P1 | Webhook processed | Audit log row created |
| AUD-10 | P1 | Subscription-impacting staff action once implemented | Audit log row created |
| AUD-11 | P2 | HWID reset once implemented | Audit log row created |
| AUD-12 | P2 | Reseller key issuance in Phase 3 | Audit log row created |

## Edge Cases

| ID | Priority | Test | Expected Result |
|---|---|---|---|
| EC-01 | P0 | Reply to closed ticket | Blocked until reopened |
| EC-02 | P1 | Reply to resolved ticket | Allowed in current implementation |
| EC-03 | P0 | Create thread in archived category as normal user | Denied |
| EC-04 | P1 | Create thread in archived category as moderator/support/admin | Allowed per current implementation |
| EC-05 | P0 | Reply in locked thread as normal user | Denied |
| EC-06 | P1 | Reply in locked thread as moderator/support/admin | Allowed per current implementation |
| EC-07 | P0 | Open missing ticket/category/thread/profile | Safe unavailable state |
| EC-08 | P0 | Hidden post and thread leakage through profile stats | No leakage |
| EC-09 | P0 | Banned user starts purchase flow after already signed in | Action fails |
| EC-10 | P0 | Banned user tries ticket or community deep links | Denied with appeal/contact guidance where applicable |

## Exit Criteria Before Phase 3

Phase 3 should not begin until:

- all P0 tests pass
- all P0 payment/webhook tests pass
- all P0 deep-link access tests pass
- all P0 launcher token lifecycle tests pass
- all P0 audit-log checks pass
- any discovered policy ambiguity around `supportStaff` community behavior is documented and accepted

## Phase 3 Readiness Note

Once this matrix is reviewed and used, proceed with Phase 3 Milestone A only:
- announcements
- changelogs

Keep them as separate models, separate admin surfaces, and separate publish flows.
