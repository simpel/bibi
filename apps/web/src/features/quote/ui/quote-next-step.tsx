import type { QuoteDto, QuoteStatus } from "@bibi/core";
import type { DateTimeFormat } from "@bibi/core/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { quoteRoute } from "@/lib/routes";
import type { QuoteAbilities } from "./quote-abilities";
import { QuoteNextStepActions } from "./quote-next-step-actions";

export type QuoteNextStepProps = {
  quote: QuoteDto;
  /** The version that counts now; another one than `quote` when it was replaced. */
  current: QuoteDto;
  can: QuoteAbilities;
  format: DateTimeFormat;
};

type Texts = Awaited<ReturnType<typeof getTranslations<"quote.nextStep">>>;

/** The line under the title: when it was sent, answered or until when it is valid. */
function detail({ quote, t, format }: { quote: QuoteDto; t: Texts; format: DateTimeFormat }) {
  const day = ({ instant }: { instant: Date | null }) => (instant ? format.date({ instant }) : "–");
  const validUntil = day({ instant: quote.validUntil });
  const changed = day({ instant: quote.statusChangedAt });
  const valid = quote.validUntil !== null && quote.validUntil > quote.statusChangedAt;
  const details: Record<QuoteStatus, string> = {
    DRAFT: t("details.DRAFT", { validUntil }),
    SENT: t("details.SENT", { sent: changed, validUntil }),
    SUPERSEDED: valid ? t("details.SUPERSEDED", { validUntil }) : t("details.lapsed"),
    ACCEPTED: t("details.ACCEPTED", {
      date: day({ instant: quote.acceptedAt ?? quote.statusChangedAt }),
    }),
    DECLINED: t("details.DECLINED", { date: changed }),
    EXPIRED: t("details.EXPIRED", { date: changed }),
  };
  return details[quote.quoteStatus];
}

/** The question the quote's status asks now; none once the customer has answered. */
function question({ quote, can, t }: { quote: QuoteDto; can: QuoteAbilities; t: Texts }) {
  if (quote.quoteStatus === "DRAFT" && can.send) return t("questions.DRAFT");
  if (quote.quoteStatus === "SENT" && (can.accept || can.decline)) return t("questions.SENT");
  if (quote.quoteStatus === "SUPERSEDED" && can.reopen) return t("questions.SUPERSEDED");
  return null;
}

/**
 * Where the quote stands and the one question that matters now, answered with buttons; the
 * rare commands are quiet links under them. Replaces a row of header buttons on the quote.
 */
export async function QuoteNextStep({ quote, current, can, format }: QuoteNextStepProps) {
  const t = await getTranslations("quote.nextStep");
  const ask = question({ quote, can, t });
  const replaced = current.id !== quote.id;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`titles.${quote.quoteStatus}`)}</CardTitle>
        <CardDescription>
          {detail({ quote, t, format })}
          {replaced ? (
            <>
              {" "}
              <Link href={quoteRoute({ id: current.id })} className="underline">
                {t("openCurrent", { version: current.version })}
              </Link>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {ask ? <p className="font-medium">{ask}</p> : null}
        <QuoteNextStepActions quote={quote} can={can} />
      </CardContent>
    </Card>
  );
}
