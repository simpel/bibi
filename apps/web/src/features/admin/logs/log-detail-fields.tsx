import type { SystemLogEntry } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";

const FIELDS = [
  "msg",
  "service",
  "surface",
  "requestId",
  "organizationId",
  "userId",
  "operation",
  "status",
  "durationMs",
  "errorCode",
] as const satisfies readonly (keyof SystemLogEntry)[];

export type LogDetailBodyProps = { entry: SystemLogEntry };

/** Indexed columns as a definition list (empty ones skipped), then the raw JSON line. */
export function LogDetailBody({ entry }: LogDetailBodyProps) {
  const t = useTranslations("admin.logs.detail");
  const rows = FIELDS.filter((field) => entry[field] !== null);
  return (
    <div className="grid gap-6 px-4 pb-4">
      <section className="grid gap-2">
        <h3 className="text-sm font-medium">{t("fields")}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map((field) => (
            <div key={field} className="contents">
              <dt className="font-mono text-xs text-muted-foreground">{field}</dt>
              <dd className="min-w-0 break-all font-mono text-xs">{String(entry[field])}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="grid gap-2">
        <h3 className="text-sm font-medium">{t("raw")}</h3>
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(entry.data, null, 2)}
        </pre>
      </section>
    </div>
  );
}
