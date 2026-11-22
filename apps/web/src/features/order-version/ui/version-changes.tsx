import type { VersionChanges, VersionLine } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

type GroupProps = { title: string; hint: string; lines: readonly { key: string; text: string }[] };

function ChangeGroup({ title, hint, lines }: GroupProps) {
  if (lines.length === 0) return null;
  return (
    <div className="grid gap-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <ul className="grid gap-0.5 text-sm">
        {lines.map((line) => (
          <li key={line.key} className="truncate">
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

const named = ({ lines }: { lines: readonly VersionLine[] }) =>
  lines.map((line) => ({ key: line.lineId, text: line.name }));

export type VersionChangesListProps = { changes: VersionChanges };

/** What restoring a version undoes (ADR 0116): lines added, removed and changed since. */
export function VersionChangesList({ changes }: VersionChangesListProps) {
  const t = useTranslations("orderVersion.changes");
  const fields = useTranslations("orderVersion.fields");
  const changed = changes.changed.map(({ line, fields: keys }) => ({
    key: line.lineId,
    text: `${line.name}: ${keys.map((key) => fields(key)).join(", ")}`,
  }));
  const headcounts = (["estimatedHeadcount", "guaranteedHeadcount"] as const).flatMap((key) => {
    const change = changes[key];
    if (!change) return [];
    const values = { from: change.from ?? "–", to: change.to ?? "–" };
    return [{ key, text: t(key, values) }];
  });
  if (changes.count === 0) return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  return (
    <div className="grid gap-4">
      <ChangeGroup
        title={t("added")}
        hint={t("addedHint")}
        lines={named({ lines: changes.added })}
      />
      <ChangeGroup
        title={t("removed")}
        hint={t("removedHint")}
        lines={named({ lines: changes.removed })}
      />
      <ChangeGroup
        title={t("changed")}
        hint={t("changedHint")}
        lines={[...changed, ...headcounts]}
      />
    </div>
  );
}
