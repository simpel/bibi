import type { ArchivePreview } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import type { ErrorKey } from "@/lib/error-key";
import { InlineLoadError } from "../states/inline-load-error";

export type ArchivePreviewPanelProps = {
  preview: ArchivePreview | null;
  loading?: boolean;
  errorKey?: ErrorKey | null;
  /** What moves: the tickets of a phase or the lines of a state. */
  unit: "tickets" | "lines";
};

/** What archiving would move and clear, and the blockers that would refuse it (ADR 0043, 0044). */
export function ArchivePreviewPanel({
  preview,
  loading = false,
  errorKey = null,
  unit,
}: ArchivePreviewPanelProps) {
  const t = useTranslations("archivePreview");
  if (errorKey) return <InlineLoadError errorKey={errorKey} />;
  if (!preview) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  return (
    <div className="grid gap-2 text-sm" aria-live="polite" aria-busy={loading}>
      <p>{t(unit === "tickets" ? "movingTickets" : "movingLines", { count: preview.moving })}</p>
      <p className="text-muted-foreground">{t("cells", { count: preview.cells })}</p>
      {preview.blockers.length === 0 ? null : (
        <div
          role="alert"
          className="grid gap-1 rounded-md border border-destructive/30 bg-destructive/10 p-3"
        >
          <p className="font-medium text-destructive">{t("blockedTitle")}</p>
          <ul className="list-disc pl-5 text-destructive">
            {preview.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
          <p className="text-muted-foreground">{t("blockedDescription")}</p>
        </div>
      )}
    </div>
  );
}
