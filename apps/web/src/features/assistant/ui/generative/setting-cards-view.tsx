"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SETTING_CARDS } from "@/features/settings/ui/setting-cards";
import type { SettingGroups } from "@/features/settings/ui/setting-props";
import type { GenerativeProps } from "./generative-props";

export type SettingCardsViewProps = GenerativeProps<"setting-cards">;

/**
 * The settings the user asked about, one card each, editable in place. The cards share one view,
 * so a save in one card (e.g. the payment operator) is what the next card (the deposit) builds on.
 */
export function SettingCardsView({ view }: SettingCardsViewProps) {
  const t = useTranslations("assistant.ui.settings");
  const [current, setCurrent] = useState(view);
  if (current.keys.length === 0)
    return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  const onSaved = ({ patch }: { patch: Partial<SettingGroups> }) =>
    setCurrent((before) => ({ ...before, ...patch }));
  return (
    <div className="grid gap-3">
      {current.keys.map((key) => {
        const Card = SETTING_CARDS[key];
        return <Card key={key} view={current} onSaved={onSaved} />;
      })}
    </div>
  );
}
