# Production Launch Checklist

This checklist is for the first production launch of the current platform scope.

## Environment Variables

- [ ] Confirm all required Next.js public and server environment variables are present in production.
- [ ] Confirm Convex deployment URL and deploy key values point to production, not staging.
- [ ] Confirm Stripe production secret, webhook secret, and publishable key are set correctly.
- [ ] Confirm hosted crypto provider production credentials and webhook secret are set correctly.
- [ ] Confirm any launcher API/base URL values point to production.
- [ ] Confirm contact/email-related environment variables are populated.
- [ ] Confirm no test keys remain in the production environment.

## Convex Deployment

- [ ] Create or confirm the production Convex deployment.
- [ ] Run schema deployment against production intentionally, not from a local accidental target.
- [ ] Confirm generated functions bundle successfully against production.
- [ ] Confirm indexes and tables exist as expected after deploy.
- [ ] Confirm admin-only queries and mutations behave correctly against production data.
- [ ] Back up any irreplaceable seed/admin content before final cutover if applicable.

## Stripe and Crypto Production Config

- [ ] Switch Stripe product/price IDs to production values.
- [ ] Verify Stripe webhook endpoint URL matches production domain.
- [ ] Verify hosted crypto webhook endpoint URL matches production domain.
- [ ] Confirm both providers point to the same production app and Convex environment.
- [ ] Run at least one real or tightly controlled production-smoke payment per provider after launch.
- [ ] Confirm webhook idempotency behavior in production logs after the first successful events.

## Domains and App URLs

- [ ] Confirm primary website domain is correct.
- [ ] Confirm canonical app URLs in Next.js metadata or app config are production values.
- [ ] Confirm pricing, login, contact, announcements, changelog, and dashboard links resolve correctly.
- [ ] Confirm launcher-facing URLs and pairing/entitlement endpoints resolve over HTTPS.
- [ ] Confirm CTA links in announcements, banners, homepage blocks, and footer/header point to production.

## Email Setup

- [ ] Confirm authentication-related email delivery is configured if used by the current auth setup.
- [ ] Confirm sender domain, SPF, DKIM, and DMARC are configured correctly.
- [ ] Confirm support/contact mailbox or workflow is operational.
- [ ] Send a real production smoke email for login/contact handling before opening beta access.

## Admin and Staff Accounts

- [ ] Create named production accounts for `admin`, `supportStaff`, and any `resellerOps` users.
- [ ] Avoid sharing one master admin account across operators.
- [ ] Enable strong passwords and any additional auth hardening supported by the current auth stack.
- [ ] Verify each operator role only has the access it needs.
- [ ] Remove or disable any temporary bootstrap accounts before public launch.

## Monitoring and Logging

- [ ] Confirm application logs are available for Next.js runtime errors.
- [ ] Confirm Convex logs are accessible to operators.
- [ ] Confirm payment webhook failures can be detected quickly.
- [ ] Confirm audit log review is part of the operational routine.
- [ ] Define who checks:
  - payment failures
  - entitlement anomalies
  - ticket queue
  - reseller redemption failures
  - launcher auth anomalies

## Data and Content Readiness

- [ ] Publish final homepage blocks.
- [ ] Publish initial announcements and changelog entries.
- [ ] Publish or archive any test banners before launch.
- [ ] Remove staging/demo-only content from production.
- [ ] Verify forum categories and permissions match intended launch posture.
- [ ] Verify badge definitions and reseller records are in the intended production state.

## Final Manual Checks

- [ ] Run the highest-risk portion of [manual-qa-matrix.md](/C:/Users/riftyzak/Desktop/projekty/marcelkaware/docs/manual-qa-matrix.md) against production or a production-equivalent environment.
- [ ] Run the operational sequence in [manual-qa-execution-checklist.md](/C:/Users/riftyzak/Desktop/projekty/marcelkaware/docs/manual-qa-execution-checklist.md).
- [ ] Run the checks in [security-review-checklist.md](/C:/Users/riftyzak/Desktop/projekty/marcelkaware/docs/security-review-checklist.md).
- [ ] Confirm zero open `P0` issues and explicit sign-off on any accepted `P1`.

## Rollback Plan

- [ ] Define the rollback owner and decision authority.
- [ ] Document how to revert the frontend deployment.
- [ ] Document how to roll back Convex deploys safely if needed.
- [ ] Document how to disable new purchases quickly if payment issues appear.
- [ ] Document how to disable launcher pairing or gated downloads quickly if entitlement issues appear.
- [ ] Prepare one public-facing maintenance or incident banner in advance.
- [ ] Prepare one internal incident checklist for:
  - payment rollback
  - access revocation mistake
  - launcher auth outage
  - reseller key abuse incident

## Launch Sign-Off

- [ ] Product/admin owner sign-off
- [ ] Security review sign-off
- [ ] Payment flow sign-off
- [ ] Support operations sign-off
- [ ] Final go/no-go decision recorded with timestamp
