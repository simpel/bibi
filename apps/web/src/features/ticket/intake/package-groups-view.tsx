import type { PlanGroup, TicketPreviewLines } from "@bibi/core";
import { useTranslations } from "next-intl";
import type { IntakePick } from "./intake-state";
import { PackageCard } from "./package-card";
import { groupPackages, type PackageCardData, type PackageOption } from "./package-groups";

export type PackageGroupsViewProps = {
  options: PackageOption[];
  preview: TicketPreviewLines;
  /** The requested period and guests, e.g. "20 Nov 09:00–12:00" and 12, for the first group. */
  period: string;
  headcount: number;
  pick: IntakePick | null;
  onPackage: (input: { card: PackageCardData }) => void;
  /** The package a read message suggests (ADR 0084). */
  suggestedId?: string | null;
};

const GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Step 3's groups (spec table), each hidden when empty; an empty first group says "Nothing
 * available then" instead of its heading. One-off is a title-row action, not a card.
 */
export function PackageGroupsView(props: PackageGroupsViewProps) {
  const t = useTranslations("ticketIntake.package");
  const { options, preview, period, headcount, pick, onPackage } = props;
  const groups = groupPackages({ options, entries: preview.entries });
  const picked = pick?.kind === "PACKAGE" ? pick.templateId : null;
  const cards = ({ group }: { group: PlanGroup }) =>
    groups[group].map((card) => (
      <PackageCard
        key={card.option.id}
        card={card}
        headcount={headcount}
        availabilityHidden={preview.availabilityHidden}
        selected={picked === card.option.id}
        suggested={props.suggestedId === card.option.id}
        onPick={() => onPackage({ card })}
      />
    ));
  const headings = {
    AVAILABLE: t("groups.available", { period, guests: headcount }),
    CLASHES: t("groups.clashes"),
    OUTSIDE_RANGE: t("groups.outside"),
  };
  return (
    <div className="grid gap-5">
      {groups.AVAILABLE.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("groups.noneAvailable", { period, guests: headcount })}
        </p>
      ) : null}
      {(["AVAILABLE", "CLASHES", "OUTSIDE_RANGE"] as const).map((group) =>
        groups[group].length === 0 ? null : (
          <section key={group} className="grid gap-2">
            <h3 className="text-sm">{headings[group]}</h3>
            <div className={GRID}>{cards({ group })}</div>
          </section>
        ),
      )}
    </div>
  );
}
