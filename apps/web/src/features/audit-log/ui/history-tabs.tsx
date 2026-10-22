"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type HistoryTabsProps = { details: ReactNode; history: ReactNode };

/** Detail page body split into the entity's details and its change history (audit log). */
export function HistoryTabs({ details, history }: HistoryTabsProps) {
  const t = useTranslations("auditLog");
  return (
    <Tabs defaultValue="details" className="grid gap-6">
      <TabsList>
        <TabsTrigger value="details">{t("details")}</TabsTrigger>
        <TabsTrigger value="history">{t("history")}</TabsTrigger>
      </TabsList>
      <TabsContent value="details">{details}</TabsContent>
      <TabsContent value="history">{history}</TabsContent>
    </Tabs>
  );
}
