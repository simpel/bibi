import { Badge, Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReadField } from "./message-draft";

function ReadRow({ row }: { row: ReadField }) {
  const t = useTranslations("ticketIntake.message");
  return (
    <li className="grid gap-0.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
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
 * "What the assistant read" (ADR 0084): each value with its quote from the message, guessed
 * values marked. The person can hide it.
 */
export function DraftReadPanel({ rows }: { rows: readonly ReadField[] }) {
  const t = useTranslations("ticketIntake.message.panel");
  const [shown, setShown] = useState(true);
  if (rows.length === 0) return null;
  if (!shown) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-self-start"
        onClick={() => setShown(true)}
      >
        {t("show")}
      </Button>
    );
  }
  return (
    <section
      aria-label={t("title")}
      className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{t("title")}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShown(false)}>
          {t("hide")}
        </Button>
      </div>
      <ul className="grid gap-2">
        {rows.map((row) => (
          <ReadRow key={`${row.field}-${row.value}-${row.quote}`} row={row} />
        ))}
      </ul>
    </section>
  );
}
