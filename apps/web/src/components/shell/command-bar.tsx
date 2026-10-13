"use client";

import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { CommandBarTrigger } from "./command-bar-trigger";
import { CommandGroups } from "./command-groups";
import { useCommandShortcut } from "./use-command-shortcut";
import { useVenueShortcuts } from "./use-venue-shortcuts";

/**
 * ⌘K command bar. Phase 1: navigation + venue/room quick actions, no LLM. The AI phase adds a
 * natural-language group here (ADR 0007); keep new groups as separate components.
 */
export function CommandBar() {
  const t = useTranslations("commandBar");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const toggle = useCallback(() => {
    setOpen((value) => !value);
    setLoaded(true);
  }, []);
  useCommandShortcut({ onToggle: toggle });
  const venues = useVenueShortcuts({ enabled: loaded });
  return (
    <>
      <CommandBarTrigger onOpen={toggle} />
      <CommandDialog open={open} onOpenChange={setOpen} title={t("title")} description={t("description")}>
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>
          <CommandGroups venues={venues} onDone={() => setOpen(false)} />
        </CommandList>
      </CommandDialog>
    </>
  );
}
