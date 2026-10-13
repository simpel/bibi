"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@okazi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "../state/assistant-context";

/** Top-bar button for the assistant panel (⌘J / Ctrl+J does the same). */
export function AssistantToggle() {
  const t = useTranslations("assistant");
  const { open, toggle } = useAssistant();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={open ? "secondary" : "ghost"}
          size="icon"
          aria-label={open ? t("close") : t("open")}
          aria-pressed={open}
          aria-keyshortcuts="Control+J Meta+J"
          onClick={toggle}
        >
          <SparklesIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("shortcutHint")}</TooltipContent>
    </Tooltip>
  );
}
