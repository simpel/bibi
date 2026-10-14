"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { CommandGroup, CommandItem } from "@okazi/ui";
import { BuildingIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VenueShortcut } from "@/features/venue/actions";
import { ROUTES } from "@/lib/routes";
import { VenueCommandGroup } from "./venue-command-group";

export type CommandGroupsProps = { venues: VenueShortcut[]; onDone: () => void };

/** Navigation and venue/room quick actions, all plain router pushes (no LLM). */
export function CommandGroups({ venues, onDone }: CommandGroupsProps) {
  const t = useTranslations("commandBar");
  const router = useRouter();
  const go = ({ href }: { href: string }) => {
    router.push(href);
    onDone();
  };
  return (
    <>
      <CommandGroup heading={t("navigate")}>
        <CommandItem onSelect={() => go({ href: ROUTES.venues })}>
          <BuildingIcon />
          {t("goToVenues")}
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading={t("actions")}>
        <CommandItem onSelect={() => go({ href: `${ROUTES.venues}?create=1` })}>
          <PlusIcon />
          {t("createVenue")}
        </CommandItem>
      </CommandGroup>
      <VenueCommandGroup venues={venues} onGo={go} />
    </>
  );
}
