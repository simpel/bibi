"use client";

import { Button } from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type CommandBarTriggerProps = { onOpen: () => void };

/** The top bar's ⌘K button: the placeholder from `md`, below it a small pill with the magnifier and ⌘K. */
export function CommandBarTrigger({ onOpen }: CommandBarTriggerProps) {
  const t = useTranslations("nav");
  return (
    <Button
      variant="outline"
      className="w-auto min-w-0 shrink justify-start gap-2 rounded-full px-3 text-muted-foreground md:w-full md:rounded-md md:px-4"
      aria-label={t("commandBar")}
      onClick={onOpen}
    >
      <SearchIcon />
      {/* Small screens: only the magnifier and ⌘K in a pill (the label stays the button's name). */}
      <span className="hidden flex-1 truncate text-left md:block">{t("commandBar")}</span>
      <kbd className="rounded border bg-muted px-1.5 text-xs md:ml-auto">⌘K</kbd>
    </Button>
  );
}
