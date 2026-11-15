"use client";

import type { PermissionSet } from "@bibi/core";
import { CommandGroup, CommandItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { VenueShortcut } from "@/features/venue/actions";
import { canPermission } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { AdminCommandGroup } from "./admin-command-group";
import { ACTION_ENTRIES, NAVIGATE_ENTRIES } from "./command-entries";
import { PrefixHintGroup } from "./prefix-hint-group";
import { VenueCommandGroup } from "./venue-command-group";

export type CommandGroupsProps = {
  query: string;
  venues: VenueShortcut[];
  permissions: PermissionSet;
  onDone: () => void;
  /** Puts a prefix (`customer:`) in the input. */
  onPrefix: (prefix: string) => void;
};

type GroupProps = { permissions: PermissionSet; onGo: (target: { href: string }) => void };

/** The sidebar's pages the caller may view. */
function NavigateGroup({ permissions, onGo }: GroupProps) {
  const t = useTranslations("commandBar");
  const nav = useTranslations("nav");
  const allowed = NAVIGATE_ENTRIES.filter(
    ({ permission }) => !permission || canPermission({ permissions, permission }),
  );
  if (allowed.length === 0) return null;
  return (
    <CommandGroup heading={t("navigate")}>
      {allowed.map(({ href, labelKey, icon: Icon }) => (
        <CommandItem key={labelKey} value={`go ${nav(labelKey)}`} onSelect={() => onGo({ href })}>
          <Icon />
          {nav(labelKey)}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/** "Create X" for each thing the caller may create. */
function ActionGroup({ permissions, onGo }: GroupProps) {
  const t = useTranslations("commandBar");
  const allowed = ACTION_ENTRIES.filter(({ permission }) =>
    canPermission({ permissions, permission }),
  );
  if (allowed.length === 0) return null;
  return (
    <CommandGroup heading={t("actions")}>
      {allowed.map(({ href, labelKey, icon: Icon }) => (
        <CommandItem key={labelKey} onSelect={() => onGo({ href })}>
          <Icon />
          {t(labelKey)}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/**
 * Quick actions, search prefixes, pages and settings sections, all plain router pushes (no LLM),
 * filtered by permissions.
 */
export function CommandGroups({
  query,
  venues,
  permissions,
  onDone,
  onPrefix,
}: CommandGroupsProps) {
  const router = useRouter();
  const go = ({ href }: { href: string }) => {
    router.push(href);
    onDone();
  };
  return (
    <>
      <ActionGroup permissions={permissions} onGo={go} />
      <PrefixHintGroup permissions={permissions} onPrefix={onPrefix} />
      <NavigateGroup permissions={permissions} onGo={go} />
      <AdminCommandGroup query={query} permissions={permissions} onGo={go} />
      <VenueCommandGroup venues={venues} onGo={go} />
    </>
  );
}
