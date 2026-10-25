import { SearchIcon } from "lucide-react";
import { Input } from "../../components/input/input";
import { cn } from "../../lib/cn";
import type { AssetBooking, CalendarAsset } from "./calendar-types";
import { GroupPicker } from "./group-picker";
import { SearchToggle } from "./search-toggle";

export type AvailabilityFilterProps = {
  assets: readonly CalendarAsset[];
  query: string;
  /** The picked groups; none picked shows every asset. */
  groups: readonly string[];
  onQuery: (query: string) => void;
  onGroups: (groups: string[]) => void;
};

/** Every group with its asset count, in the order the assets come. */
export function groupsOf({ assets }: { assets: readonly CalendarAsset[] }) {
  const names = [...new Set(assets.map((asset) => asset.group))];
  return names.map((name) => ({
    name,
    count: assets.filter((asset) => asset.group === name).length,
  }));
}

export type SearchFieldProps = Pick<AvailabilityFilterProps, "query" | "onQuery"> & {
  autoFocus?: boolean;
  className?: string;
};

/** Search by asset, or by the customer or ticket booked on it. */
export function SearchField({ query, onQuery, autoFocus, className }: SearchFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search assets, customers, tickets"
        aria-label="Search assets, customers and tickets"
        className="pl-8"
      />
    </div>
  );
}

/**
 * Which assets to show: any groups, then a search. Short of room both shrink to icons; a narrow
 * calendar uses `CompactToolbar`.
 */
export function AvailabilityFilter(props: AvailabilityFilterProps) {
  const picker = {
    groups: groupsOf({ assets: props.assets }),
    picked: props.groups,
    onPicked: props.onGroups,
  };
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
      <div className="contents @5xl:hidden">
        <GroupPicker {...picker} compact />
      </div>
      <div className="hidden @5xl:contents">
        <GroupPicker {...picker} />
      </div>
      <div className="contents @5xl:hidden">
        <SearchToggle {...props} />
      </div>
      <SearchField {...props} className="hidden w-72 @5xl:block" />
    </div>
  );
}

/** An asset matches by its own name or fact, or by a customer or ticket booked on it. */
export function matches({
  asset,
  bookings,
  query,
}: {
  asset: CalendarAsset;
  bookings: readonly AssetBooking[];
  query: string;
}): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  const own = [asset.name, asset.detail ?? ""];
  const booked = bookings
    .filter((booking) => booking.assetId === asset.id)
    .flatMap((booking) => [booking.customer ?? "", booking.ticket ?? "", booking.name]);
  return [...own, ...booked].some((text) => text.toLocaleLowerCase().includes(needle));
}
