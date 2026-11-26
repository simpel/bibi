import { cn } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

const KEYS = [
  { key: "booked", swatch: "border-2 border-primary" },
  { key: "held", swatch: "border-2 border-warning" },
  { key: "free", swatch: "border border-foreground opacity-50" },
] as const;

/** Names the three table tones, so the floor never relies on colour alone. */
export async function FloorLegend() {
  const t = await getTranslations("site.mockup.floor.legend");
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {KEYS.map(({ key, swatch }) => (
        <li key={key} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-full bg-card", swatch)} />
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
