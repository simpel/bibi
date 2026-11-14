# 0109 – The default revenue account is one row

- **Date:** 2026-11-14
- **Status:** Accepted (the user's decision, 2026-11-14: switch the default between accounts, only one can be default)
- **Amends:** 0077 (accounts are organization data; the revenue account inherits item, then item type, then organization default)
- **Related:** 0051 (single source of truth; a default is inherited, never copied)

## Context
- ADR 0077 gives the default revenue account as a number on `AccountingSettings`. Staff want to pick the default among the revenue accounts they already see per item type, and switch it.
- Copying a chosen row's number into the setting cannot say which row is the default: Dish and Meal can share 3051, and both would read as default. It also copies a fact (ADR 0051).

## Decision
1. `RevenueAccount.isDefault` marks the default row. At most one row per organization (a partial unique index and a check in `accountingSettings.update`). Item rows may be marked too, but the screen marks type rows.
2. The default revenue account is the marked row's account, else `AccountingSettings.revenueAccount`, the base account (BAS 3001 until changed). One function, `effectiveRevenueAccount`, answers it; the invoice row resolver and the account check use it.
3. Switching is an update of the row set with the flag moved. Setting the base account as the default is the same update with no row marked. The Accounting page shows a Default badge on the one row that is, in either table.

## Rejected
- Copying the row's number into `AccountingSettings.revenueAccount`. No way to tell Dish from Meal, and two stored facts.
- Removing the base account and making the default only a row. A venue with no item types mapped would have no way to set a default, and existing data would need a synthetic row.

## Consequences
- Editing the marked row's account changes the default; nothing else needs to follow.
- The base account stays stored while a row is the default, and is used again when the base row is set as the default.
- A client that replaces the revenue rows without sending `isDefault` clears the default (it replaces every mapping).
