import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toolCallExample } from "../reference/request-example";
import type { ReferenceEntry } from "../reference/types";
import { EntryBadges } from "./entry-badges";
import { SchemaView } from "./schema-view";

export type EntryBodyProps = { entry: ReferenceEntry };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-2">
      <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}

/** Expanded tool: badges, arguments, result and a copyable `tools/call` request. */
export function EntryBody({ entry }: EntryBodyProps) {
  const t = useTranslations("docs.reference");
  return (
    <div className="grid min-w-0 gap-5 border-t p-4">
      <EntryBadges entry={entry} />
      {entry.operation && (
        <p className="text-xs text-muted-foreground">
          {t("operation")} <code className="font-mono">{entry.operation}</code>
        </p>
      )}
      <Section title={t("arguments")}>
        <SchemaView schema={entry.input} />
      </Section>
      <Section title={t("response")}>
        <SchemaView schema={entry.output} />
      </Section>
      <Section title={t("example")}>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-5">
          {toolCallExample({ entry })}
        </pre>
      </Section>
    </div>
  );
}
