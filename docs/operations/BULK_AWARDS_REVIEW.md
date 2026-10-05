# Bulk awards

**Bulk awards** (`/en/bulk-awards`, `/uz/bulk-awards`, `/ru/bulk-awards`) gives many volunteers the same XP and hours in one step. It is on `feat/bulk-progress-awards` in this repository and `v-backend`. The backend design, decisions and verification are in [the plan](../../../v-backend/docs/plans/BULK_AWARDS_IMPLEMENTATION_PLAN.md).

## The flow

1. **Who receives it.** Choose **Chosen volunteers** or **Everyone**. With chosen volunteers, tick people, tick **Everyone on this page**, or search and use **Choose all results**. The selection survives paging and searching, and the chosen people appear as removable chips.
2. **What each one gets.** XP, hours or both, and a reason. The summary shows the per-volunteer amounts and the totals as you type.
3. **Review award.** Missing amounts, reason or recipients are named on the form. Otherwise a dialog repeats who, how much and why.
4. **Give award.** Applied immediately. The screen confirms how many volunteers received it and links to the award's page. **Give another award** starts a fresh form.
5. **The award's page** lists who received it, searchable and linked to each volunteer, and has **Take back award**. Each volunteer's adjustments register links bulk entries back to their award.

Files: `src/app/[locale]/(portal)/bulk-awards/`, `src/components/bulk-awards/`, `src/lib/bulk-awards/`. Copy lives under `bulkAwards` in all three catalogs. Client labels arrive as props, and amounts are formatted by `lib/bulk-awards/format.ts`, because `Intl` grouping differs between Node and browsers for `uz`.

## Verification

- `npm run lint`, `npm run typecheck`, `npm run test` (490), full `npm run test:e2e` (204, desktop and mobile).
- `e2e/bulk-awards.spec.ts`: selection across pages and searches, review and apply, Everyone, the volunteer record link, taking back, the missing-field messages, and both themes with reduced motion at both widths.

Screens: [desktop light](../reviews/bulk-awards/desktop-light.webp), [review dialog](../reviews/bulk-awards/desktop-review.webp), [award page](../reviews/bulk-awards/desktop-detail.webp), [desktop dark, Everyone](../reviews/bulk-awards/desktop-dark.webp), [mobile light](../reviews/bulk-awards/mobile-light.webp), [mobile dark review](../reviews/bulk-awards/mobile-dark.webp).
