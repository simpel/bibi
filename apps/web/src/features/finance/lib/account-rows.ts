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

/**
 * One table row. `isDefault`: its account is the default revenue account (ADR 0109); exactly one
 * row on the page is. `canBeDefault`: the base revenue account and every type row can be.
 */
export type AccountRow = {
  id: string;
  target: AccountTarget;
  value: string;
  isDefault: boolean;
  canBeDefault: boolean;
};

export type FixedRowsInput = { settings: AccountingSettingsDto };

/** The fixed accounts, in the order the form shows them. */
export function accountRows({ settings }: FixedRowsInput): AccountRow[] {
  const defaultIsRow = settings.revenueAccounts.some((row) => row.isDefault);
  return ACCOUNT_KEYS.map((key) => ({
    id: `account:${key}`,
    target: { kind: "account", key },
    value: settings[key],
    // The base revenue account is the default while no type row is (ADR 0109).
    isDefault: key === "revenueAccount" && !defaultIsRow,
    canBeDefault: key === "revenueAccount",
  }));
}

export type TypeRowsInput = { settings: AccountingSettingsDto; types: ItemTypeOption[] };

/** One row per item type that has its own revenue account. */
export function typeRows({ settings, types }: TypeRowsInput): AccountRow[] {
  return types.flatMap(({ id }) => {
    const found = settings.revenueAccounts.find(
      (row) => row.entityTypeId === id && row.itemId === null,
    );
    return found
      ? [
          {
            id: `type:${id}`,
            target: { kind: "type", entityTypeId: id } as const,
            value: found.account,
            isDefault: found.isDefault,
            canBeDefault: true,
          },
        ]
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
