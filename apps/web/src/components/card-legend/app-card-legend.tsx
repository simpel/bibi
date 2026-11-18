import { CardLegend } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { HelpHint } from "@/components/help/help-hint";

export type AppCardLegendProps = {
  /** Show Live: only where cards pulse while they happen (My work). */
  live?: boolean;
  /** Show Following: off for a table, whose rows have no fill to leave out. */
  following?: boolean;
  className?: string;
};

/**
 * A floating legend at the bottom centre, closed for good with its X (`HelpHint`).
 * What the order cards' borders, fills and badges mean, on My work, the pipeline and the order table (spec: home, Tone). */
export function AppCardLegend({ live = false, following = true, className }: AppCardLegendProps) {
  const t = useTranslations("cardLegend");
  type Key = "following" | "done" | "blocked" | "fix" | "live";
  const entry = ({ key }: { key: Key }) => ({
    name: t(`${key}.name`),
    text: t(`${key}.text`),
  });
  return (
    <HelpHint id="card-legend" floating>
      <CardLegend
        title={t("title")}
        className={className}
        labels={{
          following: following ? entry({ key: "following" }) : undefined,
          done: entry({ key: "done" }),
          blocked: entry({ key: "blocked" }),
          fix: entry({ key: "fix" }),
          live: live ? entry({ key: "live" }) : undefined,
        }}
      />
    </HelpHint>
  );
}
