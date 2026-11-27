# ADR 0001: Inventory sales and purchases use the shared drawer

Status: proposed (PR for owner review)

## Question
Should product sales and purchases run as a separate account, or move through the same drawer the shop already uses?

## Options
1. **Separate account (own cash balance).** Clear product profit, but the shop has one physical drawer. Two balances never match the cash in hand, and every transfer between them needs its own logic.
2. **Same drawer, separate ledger lines (chosen).** Cash matches the real drawer. Product money is still visible as its own lines in dashboard, reports and Excel, so it is not mixed into haircut revenue.

## Decision
Option 2.

- Sale: stock goes down, drawer goes up.
- Purchase: stock goes up, drawer goes down.
- Product sales never count in a barber's revenue.
- Stock changes only through ledger rows (`stockMovements`), so quantity and cash cannot drift apart.
- Rows are never deleted. Admin voids a row, which reverses stock and cash.
- Admin only in v1. Employee selling can be added later by exposing `productService.sell` in the employee screen.

## Consequences
- `drawerNetCash`, period report and daily records now include product sales and purchases.
- Backups from before this change load fine (missing collections default to empty).
- Product profit per item can be derived later from `unitPrice - costPrice` on SALE rows.
