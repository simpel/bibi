"use client";

import type { PermissionSet } from "@okazi/core";
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { AskAssistantGroup } from "./ask-assistant-group";
import { CommandBarTrigger } from "./command-bar-trigger";
import { CommandGroups } from "./command-groups";
import { useCommandShortcut } from "./use-command-shortcut";
import { useVenueShortcuts } from "./use-venue-shortcuts";

export type CommandBarProps = { permissions: PermissionSet };

/**
 * ⌘K command bar: navigation and quick actions the caller's `permissions` allow, plus "Ask
 * assistant" for natural language (ADR 0007). Free text + Enter hands a one-shot question to the
 * assistant on the start page.
 */
export function CommandBar({ permissions }: CommandBarProps) {
  const t = useTranslations("commandBar");
  const { ask, goHome } = useAssistant();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  const toggle = useCallback(() => {
    setOpen((value) => !value);
    setLoaded(true);
  }, []);
  useCommandShortcut({ onToggle: toggle });
  const venues = useVenueShortcuts({ enabled: loaded, permissions });
  const onAsk = ({ text }: { text: string }) => {
    if (text) ask({ text });
    else goHome();
    close();
  };
  return (
    <>
      <CommandBarTrigger onOpen={toggle} />
      <CommandDialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
        title={t("title")}
        description={t("description")}
      >
        <CommandInput placeholder={t("placeholder")} value={query} onValueChange={setQuery} />
        <CommandList>
          {query.trim() ? null : <CommandEmpty>{t("empty")}</CommandEmpty>}
          <AskAssistantGroup query={query} onAsk={onAsk} />
          <CommandGroups venues={venues} permissions={permissions} onDone={close} />
        </CommandList>
      </CommandDialog>
    </>
  );
}
