import type { AccountingSettingsDto } from "@bibi/core/schemas";
import type { Path } from "react-hook-form";
import {
  ACCOUNT_KEYS,
  type AccountingFormValues,
  type AccountKey,
  type ItemTypeOption,
} from "./accounting-form";

/** What one table row edits: a fixed account or an item type's revenue account. */
export type AccountTarget =
  | { kind: "account"; key: AccountKey }
  | { kind: "type"; entityTypeId: string };

export type AccountRow = { id: string; target: AccountTarget; value: string };

export type FixedRowsInput = { settings: AccountingSettingsDto };

/** The fixed accounts, in the order the form shows them. */
export function accountRows({ settings }: FixedRowsInput): AccountRow[] {
  return ACCOUNT_KEYS.map((key) => ({
    id: `account:${key}`,
    target: { kind: "account", key },
    value: settings[key],
  }));
}

export type TypeRowsInput = { settings: AccountingSettingsDto; types: ItemTypeOption[] };

/** One row per item type that has its own revenue account. */
export function typeRows({ settings, types }: TypeRowsInput): AccountRow[] {
  return types.flatMap(({ id }) => {
    const account = settings.revenueAccounts.find(
      (row) => row.entityTypeId === id && row.itemId === null,
    )?.account;
    return account
      ? [{ id: `type:${id}`, target: { kind: "type", entityTypeId: id } as const, value: account }]
      : [];
  });
}

/** Item types without their own revenue account yet: what "Add" can pick from. */
export function typesWithoutAccount({ settings, types }: TypeRowsInput): ItemTypeOption[] {
  const taken = new Set(
    typeRows({ settings, types }).flatMap(({ target }) =>
      target.kind === "type" ? [target.entityTypeId] : [],
    ),
  );
  return types.filter(({ id }) => !taken.has(id));
}

export type TargetFieldInput = { target: AccountTarget; types: ItemTypeOption[] };

/** The form field a row edits (`typeAccounts.<index>.account` follows the order of `types`). */
export function targetField({ target, types }: TargetFieldInput): Path<AccountingFormValues> {
  if (target.kind === "account") return target.key;
  const entityTypeId = target.entityTypeId;
  return `typeAccounts.${types.findIndex(({ id }) => id === entityTypeId)}.account`;
}
