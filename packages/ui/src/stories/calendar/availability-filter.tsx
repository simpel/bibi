import { SearchIcon } from "lucide-react";
import { Input } from "../../components/input/input";
import { Tabs, TabsList, TabsTrigger } from "../../components/tabs/tabs";
import type { AssetBooking, CalendarAsset } from "./calendar-types";

export const ALL = "all";

export type AvailabilityFilterProps = {
  assets: readonly CalendarAsset[];
  query: string;
  group: string;
  onQuery: (query: string) => void;
  onGroup: (group: string) => void;
};

/** Search by asset or by who booked it; pick one group of assets. Groups are the org's own. */
export function AvailabilityFilter({ assets, query, group, ...on }: AvailabilityFilterProps) {
  const groups = [...new Set(assets.map((asset) => asset.group))];
  const count = ({ name }: { name: string }) =>
    assets.filter((asset) => name === ALL || asset.group === name).length;
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={group} onValueChange={on.onGroup} className="min-w-0 overflow-x-auto">
        <TabsList>
          {[ALL, ...groups].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name === ALL ? "All" : name}
              <span className="ml-1.5 text-muted-foreground tabular-nums">{count({ name })}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative sm:w-72">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => on.onQuery(event.target.value)}
          placeholder="Search assets, customers, tickets"
          aria-label="Search assets, customers and tickets"
          className="pl-8"
        />
      </div>
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
