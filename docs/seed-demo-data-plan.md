# Seed and Demo Data Plan

Use this plan to prepare a realistic beta/staging environment for QA, demos, and operator walkthroughs.

## General Rules

- Keep all demo copy premium, neutral, and product-first.
- Do not seed risky or explicit language.
- Use clearly fake but internally consistent emails, handles, and payment references.
- Mark all demo records in notes or internal references where possible.
- Do not use production customer data for staging/demo content.

## Accounts

Create these baseline accounts:
- `registered`
- `activeSubscriber`
- `expiredSubscriber`
- `moderator`
- `supportStaff`
- `adminOnly`
- `adminSubscriber`
- `banned`

Optional mixed-role expansion:
- `supportSubscriber`
- `moderatorSubscriber`

## Homepage

Seed published homepage blocks for every supported type:
- one `heroSupportText` block with premium neutral support text
- one `trustStrip` block with 3 to 5 short trust items
- one `featureRow` block with 3 feature items
- one `faqRow` block with 4 common pre-purchase questions
- one `ctaBlock` block for account creation or pricing

Also seed:
- one draft block of each type for admin preview/status checks

## Announcements

Seed:
- one published public announcement
- one published members-only announcement
- one published subscribers-only announcement
- one pinned public announcement
- one draft announcement

Suggested examples:
- maintenance window notice
- account security reminder
- subscriber delivery update

## Changelogs

Seed:
- two published releases
- one draft release

Each published release should include grouped entries for:
- `Added`
- `Improved`
- `Fixed`
- `Known Issues`

Use realistic neutral release language tied to launcher, account, delivery, or community improvements.

## Banners

Seed:
- one currently active published banner
- one draft banner
- one scheduled future banner
- one expired-window banner

Audience coverage:
- one `public`
- one `authenticated`
- one `subscriber`
- one `staff`

## Badges

Seed published badge definitions:
- `Founder`
- `Verified`
- `Early Access`
- `Staff`
- `Moderator`

Seed one draft badge definition for admin preview testing.

Assignments:
- assign `Staff` to `supportStaff` and `adminOnly`
- assign `Moderator` to `moderator`
- assign `Founder` and `Early Access` to `activeSubscriber`
- assign at least one hidden/draft badge to a user to verify non-public behavior

## Forum Categories and Threads

Seed categories:
- one guest-visible news/discussion category
- one registered-visible general discussion category
- one subscriber-only customer area
- one archived reference category

Seed threads/posts:
- one open thread in each visible category
- one locked thread
- one hidden thread
- one visible thread containing one hidden post
- enough replies to exercise profile counts and badge rows

Ensure authors span multiple roles so profile leakage checks are meaningful.

## Tickets

Seed:
- one open ticket owned by `registered`
- one open ticket owned by `activeSubscriber`
- one resolved ticket
- one closed ticket
- one assigned ticket for staff queue testing
- one ticket with internal notes

Use categories that reflect current support taxonomy and include enough replies for lifecycle/state testing.

## Resellers and Keys

Seed:
- one active reseller
- one paused reseller
- one inactive reseller

For batches:
- one newly created batch with unissued keys
- one issued batch
- one mixed-status batch containing:
  - unissued key
  - issued key
  - redeemed key
  - revoked key

For redemption testing:
- one valid key for a user with no subscription
- one valid key for an active subscriber extension test
- one valid key for an expired subscriber reactivation test
- one revoked key
- one already redeemed key

## Payments and Subscriptions

Seed:
- one active Stripe-backed subscription/payment chain
- one active crypto-backed subscription/payment chain
- one expired subscription
- one failed-renewal example if the environment supports safe simulation
- one dispute/chargeback example in non-production test mode if supported

## Audit Log Coverage

Before demo/QA sign-off, ensure the seed run or manual prep creates audit rows for:
- announcement publish/unpublish
- changelog publish/unpublish
- banner publish/unpublish
- homepage block publish/unpublish/reorder
- badge assign/remove
- ticket assignment/status update
- forum moderation
- reseller batch generation, issuance, redemption, revocation
