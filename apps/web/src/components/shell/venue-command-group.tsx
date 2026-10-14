"use client";

import { CommandGroup, CommandItem, CommandSeparator } from "@okazi/ui";
import { BuildingIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VenueShortcut } from "@/features/venue/actions";
import { venueRoute } from "@/lib/routes";

export type VenueCommandGroupProps = {
  venues: VenueShortcut[];
  onGo: (target: { href: string }) => void;
};

/** "Open <venue>" for the first venues of the organization. */
export function VenueCommandGroup({ venues, onGo }: VenueCommandGroupProps) {
  const t = useTranslations("commandBar");
  if (venues.length === 0) return null;
  return (
    <>
      <CommandSeparator />
      <CommandGroup heading={t("venuesGroup")}>
        {venues.map(({ id, name }) => (
          <CommandItem key={id} onSelect={() => onGo({ href: venueRoute({ id }) })}>
            <BuildingIcon />
            {t("openVenue", { name })}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}
