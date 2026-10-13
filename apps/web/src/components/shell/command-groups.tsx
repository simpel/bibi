"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { CommandGroup, CommandItem, CommandSeparator } from "@okazi/ui";
import { BuildingIcon, DoorOpenIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VenueShortcut } from "@/features/venue/actions";
import { ROUTES, venueRoute } from "@/lib/routes";

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
      {venues.length > 0 ? <CommandSeparator /> : null}
      <CommandGroup heading={t("venuesGroup")}>
        {venues.flatMap((venue) => [
          <CommandItem key={venue.id} onSelect={() => go({ href: venueRoute({ id: venue.id }) })}>
            <BuildingIcon />
            {t("openVenue", { name: venue.name })}
          </CommandItem>,
          <CommandItem
            key={`${venue.id}-room`}
            onSelect={() => go({ href: `${venueRoute({ id: venue.id })}?createRoom=1` })}
          >
            <DoorOpenIcon />
            {t("addRoomTo", { name: venue.name })}
          </CommandItem>,
        ])}
      </CommandGroup>
    </>
  );
}
