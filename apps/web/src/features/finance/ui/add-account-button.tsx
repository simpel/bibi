"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { typesWithoutAccount } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { AccountDialog } from "./account-dialog";

export type AddAccountButtonProps = { settings: AccountingSettingsDto; types: ItemTypeOption[] };

/** Opens the add dialog: a revenue account for an item type that has none yet. */
export function AddAccountButton({ settings, types }: AddAccountButtonProps) {
  const t = useTranslations("finance.accounting");
  const [open, setOpen] = useState(false);
  const choices = typesWithoutAccount({ settings, types });
  if (choices.length === 0) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("add")}
      </Button>
      <AccountDialog
        open={open}
        onOpenChange={setOpen}
        settings={settings}
        types={types}
        choices={choices}
      />
    </>
  );
}
