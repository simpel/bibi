"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DemandDialog } from "./demand-dialog";
import type { DemandList, PoolOption } from "./demand-types";

export type CreateDemandButtonProps = {
  itemId: string;
  pools: readonly PoolOption[];
  list: DemandList;
};

/** Opens the demand dialog for the item on the page. */
export function CreateDemandButton({ itemId, pools, list }: CreateDemandButtonProps) {
  const t = useTranslations("itemDemand");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t(`${list}.create`)}
      </Button>
      <DemandDialog itemId={itemId} pools={pools} list={list} open={open} onOpenChange={setOpen} />
    </>
  );
}
