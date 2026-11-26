"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { LayoutOption } from "../lib/sitting-row";
import { SittingSheet } from "./sitting-sheet";

export type CreateSittingButtonProps = { roomItemId: string; layouts: readonly LayoutOption[] };

/** Create sitting: opens the sitting sheet empty. */
export function CreateSittingButton({ roomItemId, layouts }: CreateSittingButtonProps) {
  const t = useTranslations("tableBooking.sittings");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={layouts.length === 0}>
        <PlusIcon />
        {t("create")}
      </Button>
      <SittingSheet roomItemId={roomItemId} layouts={layouts} open={open} onOpenChange={setOpen} />
    </>
  );
}
