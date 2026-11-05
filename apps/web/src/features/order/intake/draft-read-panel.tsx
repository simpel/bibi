import { Badge, Button, Popover, PopoverContent, PopoverTrigger } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReadField } from "./message-draft";

function ReadRow({ row }: { row: ReadField }) {
  const t = useTranslations("orderIntake.message");
  return (
    <li className="grid gap-0.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-muted-foreground">{t(`labels.${row.field}`)}</span>
      <span className="grid gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.value}</span>
          {row.guessed ? <Badge variant="outline">{t("panel.guessed")}</Badge> : null}
        </span>
        <span className="text-muted-foreground">
          {row.quote ? `“${row.quote}”` : t("panel.notInMessage")}
        </span>
      </span>
    </li>
  );
}

/**
 * "What the assistant read" (ADR 0084): a small button that opens each value with its quote from
 * the message, guessed values marked.
 */
export function DraftReadPanel({ rows }: { rows: readonly ReadField[] }) {
  const t = useTranslations("orderIntake.message.panel");
  if (rows.length === 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <SparklesIcon aria-hidden />
          {t("title")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(36rem,calc(100vw-2rem))] text-sm">
        <section aria-label={t("title")} className="grid gap-3">
          <h3 className="font-medium">{t("title")}</h3>
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto">
            {rows.map((row) => (
              <ReadRow key={`${row.field}-${row.value}-${row.quote}`} row={row} />
            ))}
          </ul>
        </section>
      </PopoverContent>
    </Popover>
  );
}
