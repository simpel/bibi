import type { OrderPreviewLines } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { IntakePick, IntakeWhen } from "./intake-state";
import { rankPackages } from "./package-compare";
import { PackageDetail } from "./package-detail";
import { type PackageCardData, type PackageOption, packageCards } from "./package-groups";
import { PackageList } from "./package-list";

export type PackagePickerProps = {
  options: PackageOption[];
  preview: OrderPreviewLines;
  /** The requested period, e.g. "20 Nov 09:00–12:00", for the lead sentence. */
  period: string;
  when: IntakeWhen;
  pick: IntakePick | null;
  onPackage: (input: { card: PackageCardData }) => void;
  /** The package a read message suggests (ADR 0084): shown first. */
  suggestedId?: string | null;
};

/**
 * Step 3's packages (spec "Your request vs the package"): one list, closest to the request first,
 * and the package in focus beside it, row by row against what was asked. Pick opens the
 * follow-up questions for what it changes.
 */
export function PackagePicker(props: PackagePickerProps) {
  const t = useTranslations("orderIntake.package");
  const { options, preview, period, when, pick, onPackage, suggestedId } = props;
  const ranked = rankPackages({
    cards: packageCards({ options, entries: preview.entries }),
    headcount: when.guests,
    availabilityHidden: preview.availabilityHidden,
  });
  const pickedId = pick?.kind === "PACKAGE" ? pick.templateId : null;
  const [focused, setFocused] = useState<string | null>(null);
  const focusId = focused ?? pickedId ?? suggestedId ?? ranked[0]?.card.option.id ?? null;
  const current = ranked.find(({ card }) => card.option.id === focusId) ?? ranked[0];
  const fitting = ranked.filter(({ changes }) => changes === 0).length;
  if (!current) return null;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        {fitting === 0
          ? t("lead.nothingFits", { period, guests: when.guests })
          : t("lead.someFit", { count: fitting, period, guests: when.guests })}
      </p>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <PackageList
          {...{ ranked, pickedId, suggestedId }}
          focusedId={current.card.option.id}
          onFocus={({ id }) => setFocused(id)}
        />
        <PackageDetail
          compare={current}
          when={when}
          picked={pickedId === current.card.option.id}
          onPick={() => onPackage({ card: current.card })}
        />
      </div>
    </div>
  );
}
