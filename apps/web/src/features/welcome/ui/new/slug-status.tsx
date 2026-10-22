"use client";

import { Button, cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { SlugCheckState } from "./use-slug-check";
import { useSlugMessage } from "./use-slug-message";

export type SlugStatusProps = {
  check: SlugCheckState;
  onUse: ({ value }: { value: string }) => void;
};

/** The live message under the address field, with a button that takes the suggestion. */
export function SlugStatus({ check, onUse }: SlugStatusProps) {
  const t = useTranslations("welcome.new");
  const suggestion = check.status === "checking" ? null : check.suggestion;
  const message = useSlugMessage({ check });
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onUse({ value: suggestion })}
        >
          {t("useSuggestion", { suggestion })}
        </Button>
      ) : null}
    </div>
  );
}
