"use client";

import { Button } from "@okazi/ui";
import { PlusIcon, TimerOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ExpireDueDialog } from "./expire-due-dialog";
import { OptionDialog } from "./option-dialog";

export type OptionQueueActionsProps = { itemId: string };

/** Place an option on the item, or expire every overdue option now instead of waiting. */
export function OptionQueueActions({ itemId }: OptionQueueActionsProps) {
  const t = useTranslations("option");
  const [dialog, setDialog] = useState<"create" | "expire" | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" onClick={() => setDialog("expire")}>
        <TimerOffIcon />
        {t("expireDue")}
      </Button>
      <Button variant="outline" onClick={() => setDialog("create")}>
        <PlusIcon />
        {t("create")}
      </Button>
      <OptionDialog
        itemId={itemId}
        open={dialog === "create"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ExpireDueDialog
        open={dialog === "expire"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
