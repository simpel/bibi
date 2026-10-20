import type { ChangePreview } from "@okazi/core/schemas";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { consequenceKey } from "../../../lib/consequence-keys";
import { AcknowledgeCheck } from "./acknowledge-check";

export type ConsequenceListProps = {
  consequences: ChangePreview["consequences"];
  acknowledged: boolean;
  onAcknowledge: (input: { acknowledged: boolean }) => void;
  disabled: boolean;
};

type Item = ChangePreview["consequences"][number];

function ConsequenceText({ consequence }: { consequence: Item }) {
  const t = useTranslations("assistant.approval.consequences");
  const key = consequenceKey({ key: consequence.key });
  return <span>{key ? t(`items.${key}`, consequence.values) : t("other")}</span>;
}

/** What the change affects beyond its fields; a warning must be acknowledged before Confirm. */
export function ConsequenceList({
  consequences,
  acknowledged,
  onAcknowledge,
  disabled,
}: ConsequenceListProps) {
  const t = useTranslations("assistant.approval");
  if (consequences.length === 0) return null;
  const warned = consequences.some((consequence) => consequence.severity === "warning");
  return (
    <section
      data-slot="approval-consequences"
      className="grid gap-2"
      aria-label={t("consequences.title")}
    >
      <ul className="grid gap-1.5 text-sm">
        {consequences.map((consequence) => (
          <li
            key={consequence.key}
            className="flex items-start gap-2"
            data-severity={consequence.severity}
          >
            {consequence.severity === "warning" ? (
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <ConsequenceText consequence={consequence} />
          </li>
        ))}
      </ul>
      {warned ? (
        <AcknowledgeCheck checked={acknowledged} disabled={disabled} onChange={onAcknowledge} />
      ) : null}
    </section>
  );
}
