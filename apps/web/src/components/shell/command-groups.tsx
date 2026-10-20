"use client";

import type { PermissionSet } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { CommandGroup, CommandItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { VenueShortcut } from "@/features/venue/actions";
import { canPermission } from "@/lib/can";
import { ACTION_ENTRIES, type CommandEntry, NAVIGATE_ENTRIES } from "./command-entries";
import { VenueCommandGroup } from "./venue-command-group";

export type CommandGroupsProps = {
  venues: VenueShortcut[];
  permissions: PermissionSet;
  onDone: () => void;
};

type EntryGroupProps = {
  heading: string;
  entries: readonly CommandEntry[];
  permissions: PermissionSet;
  onGo: (target: { href: string }) => void;
};

/** One group of entries; the entries the caller may not use are left out, and an empty group too. */
function EntryGroup({ heading, entries, permissions, onGo }: EntryGroupProps) {
  const t = useTranslations("commandBar");
  const allowed = entries.filter(({ permission }) => canPermission({ permissions, permission }));
  if (allowed.length === 0) return null;
  return (
    <CommandGroup heading={heading}>
      {allowed.map(({ href, labelKey, icon: Icon }) => (
        <CommandItem key={labelKey} onSelect={() => onGo({ href })}>
          <Icon />
          {t(labelKey)}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/** Navigation and quick actions, all plain router pushes (no LLM), filtered by permissions. */
export function CommandGroups({ venues, permissions, onDone }: CommandGroupsProps) {
  const t = useTranslations("commandBar");
  const router = useRouter();
  const go = ({ href }: { href: string }) => {
    router.push(href);
    onDone();
  };
  return (
    <>
      <EntryGroup
        heading={t("navigate")}
        entries={NAVIGATE_ENTRIES}
        permissions={permissions}
        onGo={go}
      />
      <EntryGroup
        heading={t("actions")}
        entries={ACTION_ENTRIES}
        permissions={permissions}
        onGo={go}
      />
      <VenueCommandGroup venues={venues} onGo={go} />
    </>
  );
}
