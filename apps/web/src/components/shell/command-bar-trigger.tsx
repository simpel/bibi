"use client";

import { Button } from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type CommandBarTriggerProps = { onOpen: () => void };

export function CommandBarTrigger({ onOpen }: CommandBarTriggerProps) {
  const t = useTranslations("nav");
  return (
    <Button
      variant="outline"
      className="w-full min-w-0 max-w-xs shrink justify-start gap-2 text-muted-foreground"
      aria-label={t("commandBar")}
      onClick={onOpen}
    >
      <SearchIcon />
      <span className="flex-1 truncate text-left">{t("commandBar")}</span>
      <kbd className="hidden rounded border bg-muted px-1.5 text-xs sm:inline">⌘K</kbd>
    </Button>
  );
}
