"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { useState } from "react";
import type { SittingTables } from "../lib/sitting-tables";
import { SittingTablesEditor } from "./sitting-tables-editor";

export type SittingTablesTabsProps = {
  itemId: string;
  sittings: readonly SittingTables[];
  layouts: readonly { id: string; name: string }[];
  canEdit: boolean;
};

/** One tab per sitting: Lunch and Dinner may run on different floors. */
export function SittingTablesTabs({ itemId, sittings, layouts, canEdit }: SittingTablesTabsProps) {
  const [current, setCurrent] = useState(sittings[0]?.sittingId ?? "");
  return (
    <Tabs value={current} onValueChange={setCurrent} className="grid gap-4">
      <TabsList className="max-w-full justify-start overflow-x-auto">
        {sittings.map((sitting) => (
          <TabsTrigger
            key={sitting.sittingId}
            value={sitting.sittingId}
            className="flex-none gap-2"
          >
            {sitting.sittingName}
            <span className="text-xs text-muted-foreground">{sitting.layoutName}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {sittings.map((sitting) => (
        <TabsContent key={sitting.sittingId} value={sitting.sittingId} className="mt-0">
          <SittingTablesEditor
            key={`${sitting.layoutId}-${sitting.signature}`}
            itemId={itemId}
            sitting={sitting}
            layouts={layouts}
            canEdit={canEdit}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
