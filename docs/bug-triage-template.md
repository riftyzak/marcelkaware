# Bug Triage Template

Use this template for beta-readiness issues found during QA, security review, or launch preparation.

## Severity Definitions

### `P0` Critical

Use `P0` when the issue creates release-blocking risk such as:
- auth or RBAC bypass
- deep-link access bypass
- banned user retaining paid, support, or community access incorrectly
- entitlement, download, or launcher pairing restriction failure
- payment/webhook idempotency failure that corrupts subscription or payment state
- ticket ownership or staff boundary breach
- subscriber-only or hidden community/profile data leakage
- reseller key redemption, reuse, or revocation failure that grants incorrect access
- missing audit logs for sensitive operational actions
- production crash on critical purchase, auth, admin, support, or entitlement path

Target response:
- fix immediately
- no beta launch with open `P0`

### `P1` High

Use `P1` when the issue does not fully break security or access control but materially harms product operations or trust:
- incorrect but non-bypass permission messaging
- broken admin workflow with workaround
- inconsistent publish/unpublish or status handling
- audit log readability failure when rows still exist
- severe mobile usability problem in key flows
- missing or misleading status preview in admin/content surfaces
- staff workflow confusion likely to cause operator mistakes

Target response:
- fix before broad beta if feasible
- acceptable only with explicit temporary mitigation

### `P2` Medium

Use `P2` for polish, clarity, and low-risk operational defects:
- copy inconsistency
- spacing/layout polish
- minor empty/loading/error-state issues
- non-critical navigation friction
- low-risk preview/readability issues

Target response:
- batch into follow-up polish

## Issue Template

```md
# [Severity] Short title

## Summary
- One-sentence description of the issue.

## Area
- auth / RBAC / payments / launcher / tickets / forum / profiles / admin / content / reseller / audit

## Environment
- branch or deployment:
- browser/device:
- role/account used:
- route(s):

## Steps to Reproduce
1. 
2. 
3. 

## Expected Result
- 

## Actual Result
- 

## Impact
- Who is affected:
- Security/privacy risk:
- Revenue/operations risk:
- Workaround:

## Evidence
- screenshots:
- console errors:
- network requests:
- related audit rows:

## Scope Check
- Reproduces consistently: yes / no
- Role-specific or global:
- Deep-link only or normal navigation too:
- Regression from previous validated milestone: yes / no

## Suggested Owner
- frontend / convex backend / payments / launcher / admin ops
```

## Triage Rules

- Escalate to `P0` if there is any confirmed unauthorized visibility, unauthorized write, or incorrect entitlement grant.
- Escalate to `P0` if payment state can create duplicate access or fail to revoke access on dispute/revocation.
- Escalate to `P0` if banned users can use normal support, paid delivery, launcher pairing, or community.
- Escalate to `P1` if the control is secure but the operator-facing UI is likely to cause an incorrect admin action.
- Keep `P2` for issues that do not affect security boundaries, entitlement, payment correctness, or core support/community operations.
