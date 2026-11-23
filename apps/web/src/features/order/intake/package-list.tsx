import { cn, VisualTile } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { PackageCompare } from "./package-compare";
import type { PackageOption } from "./package-groups";

/** The package's own image, else its first line's picture. */
export function packageVisual({ option }: { option: PackageOption }) {
  const line = option.lines.find(({ imageUrl, icon }) => imageUrl || icon);
  return { src: option.imageUrl ?? line?.imageUrl ?? null, icon: line?.icon ?? null };
}

export type PackageListProps = {
  ranked: PackageCompare[];
  focusedId: string | null;
  pickedId: string | null;
  suggestedId?: string | null;
  onFocus: (input: { id: string }) => void;
};

/** Every package, closest to the request first; a click shows it beside the list. */
export function PackageList({
  ranked,
  focusedId,
  pickedId,
  suggestedId,
  onFocus,
}: PackageListProps) {
  const t = useTranslations("orderIntake.package");
  const message = useTranslations("orderIntake.message");
  return (
    <ul className="grid content-start gap-1" aria-label={t("listLabel")}>
      {ranked.map(({ card: { option }, changes }) => (
        <li key={option.id}>
          <button
            type="button"
            aria-pressed={focusedId === option.id}
            onClick={() => onFocus({ id: option.id })}
            className={cn(
              "flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              focusedId === option.id && "border-primary/40 bg-accent",
            )}
          >
            <VisualTile {...packageVisual({ option })} />
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-medium">{option.name}</span>
              <span
                className={cn(
                  "text-xs",
                  changes === 0 ? "text-success" : "text-warning-foreground",
                )}
              >
                {pickedId === option.id ? t("pickedShort") : t("changes", { count: changes })}
              </span>
              {suggestedId === option.id ? (
                <span className="text-xs font-medium text-primary">{message("suggested")}</span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
