import type { QuoteDto } from "@bibi/core";
import type { NumberFormat } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { quoteRoute } from "@/lib/routes";
import { QuoteStatusBadge } from "./quote-status-badge";

export type QuoteOtherVersionsProps = {
  /** The version shown above, left out of the list. */
  quote: QuoteDto;
  versions: readonly QuoteDto[];
  numbers: NumberFormat;
};

/** The order's other quote versions, newest first, each a link to its own page. */
export async function QuoteOtherVersions({ quote, versions, numbers }: QuoteOtherVersionsProps) {
  const others = [...versions]
    .filter(({ id }) => id !== quote.id)
    .sort((a, b) => b.version - a.version);
  if (others.length === 0) return null;
  const t = await getTranslations("quote");
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{t("otherVersions")}</h3>
      <ul className="grid divide-y rounded-md border">
        {others.map((version) => (
          <li key={version.id}>
            <Link
              href={quoteRoute({ id: version.id })}
              className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">{t("versionLabel", { version: version.version })}</span>
              <QuoteStatusBadge status={version.quoteStatus} />
              <span className="ml-auto tabular-nums text-muted-foreground">
                {numbers.money({ minor: version.totalInclVatMinor })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
