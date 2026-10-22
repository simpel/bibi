"use client";

import { Button, cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { SlugCheckState } from "./use-slug-check";

export type SlugStatusProps = { check: SlugCheckState; onUse: (slug: string) => void };

/** The live message under the address field, with a button that takes the suggestion. */
export function SlugStatus({ check, onUse }: SlugStatusProps) {
  const t = useTranslations("welcome.new");
  const slug = check.slug;
  const suggestion = check.status === "checking" ? null : check.suggestion;
  const message =
    check.status === "checking"
      ? t("slugChecking", { slug })
      : check.status === "free"
        ? t("slugFree", { slug })
        : check.status === "invalid"
          ? t("slugInvalid")
          : t(check.status === "taken" ? "slugTaken" : "slugReserved", {
              slug,
              suggestion: suggestion ?? "",
            });
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      <p
        className={cn(
          "text-sm",
          check.status === "free" && "text-foreground",
          check.status === "checking" && "text-muted-foreground",
          (check.status === "taken" || check.status === "reserved") && "text-warning-foreground",
          check.status === "invalid" && "text-destructive",
        )}
      >
        {message}
      </p>
      {suggestion ? (
        <Button type="button" size="sm" variant="outline" onClick={() => onUse(suggestion)}>
          {t("useSuggestion", { suggestion })}
        </Button>
      ) : null}
    </div>
  );
}
