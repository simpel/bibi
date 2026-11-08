"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SettingGroups } from "@/features/settings/ui/setting-props";
import { SETTING_ROWS } from "@/features/settings/ui/setting-rows";
import type { GenerativeProps } from "./generative-props";

export type SettingCardsViewProps = GenerativeProps<"setting-cards">;

/**
 * The settings the user asked about in one card, one row each, editable in place. The rows share
 * one view, so a save in one row (e.g. the payment operator) is what the next row builds on.
 */
export function SettingCardsView({ view }: SettingCardsViewProps) {
  const t = useTranslations("assistant.ui.settings");
  const [current, setCurrent] = useState(view);
  if (current.keys.length === 0)
    return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  const onSaved = ({ patch }: { patch: Partial<SettingGroups> }) =>
    setCurrent((before) => ({ ...before, ...patch }));
  return (
    <Card data-slot="setting-cards" className="gap-0 overflow-hidden py-0 shadow-none">
      {current.keys.map((key) => {
        const Row = SETTING_ROWS[key];
        return <Row key={key} view={current} onSaved={onSaved} />;
      })}
    </Card>
  );
}
