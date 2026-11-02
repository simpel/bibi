import type { TicketPreviewLines } from "@bibi/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { IntakePick } from "./intake-state";
import { PackageCard } from "./package-card";
import {
  groupPackages,
  type PackageCardData,
  type PackageOption,
  type PackageTab,
  tabsOf,
} from "./package-groups";

export type PackageGroupsViewProps = {
  options: PackageOption[];
  preview: TicketPreviewLines;
  /** The requested period, e.g. "20 Nov 09:00–12:00", for the empty first tab. */
  period: string;
  headcount: number;
  pick: IntakePick | null;
  onPackage: (input: { card: PackageCardData }) => void;
  /** The package a read message suggests (ADR 0084): its tab opens first. */
  suggestedId?: string | null;
};

const GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

type FirstTabInput = { tabs: Record<PackageTab, PackageCardData[]>; suggestedId?: string | null };

/** The suggested package's tab, else the first unless it is empty and the second is not. */
function firstTab({ tabs, suggestedId }: FirstTabInput): PackageTab {
  if (tabs.ADJUST.some(({ option }) => option.id === suggestedId)) return "ADJUST";
  return tabs.FITS.length === 0 && tabs.ADJUST.length > 0 ? "ADJUST" : "FITS";
}

/** A tab's cards, or its empty line. */
function TabCards({ cards, empty }: { cards: ReactNode[]; empty: string }) {
  if (cards.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return <div className={GRID}>{cards}</div>;
}

/** Step 3's packages in two tabs (spec "Two tabs"): fits the request, needs adjusting. */
export function PackageGroupsView(props: PackageGroupsViewProps) {
  const t = useTranslations("ticketIntake.package");
  const { options, preview, period, headcount, pick, onPackage, suggestedId } = props;
  const tabs = tabsOf({ groups: groupPackages({ options, entries: preview.entries }) });
  const picked = pick?.kind === "PACKAGE" ? pick.templateId : null;
  const cards = ({ tab }: { tab: PackageTab }) =>
    tabs[tab].map((card) => (
      <PackageCard
        key={card.option.id}
        card={card}
        headcount={headcount}
        availabilityHidden={preview.availabilityHidden}
        selected={picked === card.option.id}
        suggested={suggestedId === card.option.id}
        onPick={() => onPackage({ card })}
      />
    ));
  return (
    <Tabs defaultValue={firstTab({ tabs, suggestedId })} className="gap-3">
      <TabsList>
        <TabsTrigger value="FITS">{t("tabs.fits", { count: tabs.FITS.length })}</TabsTrigger>
        <TabsTrigger value="ADJUST">{t("tabs.adjust", { count: tabs.ADJUST.length })}</TabsTrigger>
      </TabsList>
      <TabsContent value="FITS">
        <TabCards
          cards={cards({ tab: "FITS" })}
          empty={t("tabs.nothingFits", { period, guests: headcount })}
        />
      </TabsContent>
      <TabsContent value="ADJUST">
        <TabCards cards={cards({ tab: "ADJUST" })} empty={t("tabs.nothingToAdjust")} />
      </TabsContent>
    </Tabs>
  );
}
