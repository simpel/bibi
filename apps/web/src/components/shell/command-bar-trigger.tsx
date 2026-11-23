"use client";

import { Button } from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type CommandBarTriggerProps = { onOpen: () => void };

/** The top bar's ⌘K button; narrow, it shows only the magnifier and the shortcut. */
export function CommandBarTrigger({ onOpen }: CommandBarTriggerProps) {
  const t = useTranslations("nav");
  return (
    <Button
      variant="outline"
      className="@container w-full min-w-0 shrink justify-start gap-2 text-muted-foreground"
      aria-label={t("commandBar")}
      onClick={onOpen}
    >
      <SearchIcon />
      {/* Room for the words, else just the magnifier and ⌘K (the label stays the button's name). */}
      <span className="hidden flex-1 truncate text-left @[16rem]:block">{t("commandBar")}</span>
      <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-xs sm:inline">⌘K</kbd>
    </Button>
  );
}
