"use client";

import { CommandGroup, CommandItem, CommandSeparator } from "@okazi/ui";
import { BuildingIcon, DoorOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VenueShortcut } from "@/features/venue/actions";
import { venueRoute } from "@/lib/routes";

export type VenueCommandGroupProps = {
  venues: VenueShortcut[];
  onGo: (target: { href: string }) => void;
};

/** "Open <venue>" and "Add a room to <venue>" for the first venues of the organization. */
export function VenueCommandGroup({ venues, onGo }: VenueCommandGroupProps) {
  const t = useTranslations("commandBar");
  if (venues.length === 0) return null;
  return (
    <>
      <CommandSeparator />
      <CommandGroup heading={t("venuesGroup")}>
        {venues.flatMap(({ id, name }) => [
          <CommandItem key={id} onSelect={() => onGo({ href: venueRoute({ id }) })}>
            <BuildingIcon />
            {t("openVenue", { name })}
          </CommandItem>,
          <CommandItem
            key={`${id}-room`}
            onSelect={() => onGo({ href: `${venueRoute({ id })}?createRoom=1` })}
          >
            <DoorOpenIcon />
            {t("addRoomTo", { name })}
          </CommandItem>,
        ])}
      </CommandGroup>
    </>
  );
}
