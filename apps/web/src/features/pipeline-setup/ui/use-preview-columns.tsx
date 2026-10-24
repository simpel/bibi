import type { PipelinePreviewLine, PipelinePreviewStep } from "@bibi/core/schemas";
import { ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export type PreviewColumnsInput = { types: string[] };

type LineCellProps = { line: PipelinePreviewLine | undefined };

/** A line's state with its color, its hold and, when the grid could not move it, why. */
function LineCell({ line }: LineCellProps) {
  const t = useTranslations("pipelineSetup.preview");
  if (!line) return null;
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="inline-flex items-center gap-2">
        {line.color ? <ColorSwatch color={line.color} /> : null}
        <span className={line.changed ? "font-medium" : undefined}>{line.state ?? "-"}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {line.released ? t("released") : t(`holds.${line.hold}`)}
      </span>
      {line.blocked ? <span className="text-xs text-destructive">{t("blocked")}</span> : null}
    </div>
  );
}

/** The status, then one column per item type with the line's state in that status. */
export function usePreviewColumns({
  types,
}: PreviewColumnsInput): ColumnDef<PipelinePreviewStep>[] {
  const t = useTranslations("pipelineSetup.preview");
  return useMemo(() => {
    const ticketStatus: ColumnDef<PipelinePreviewStep> = {
      id: "status",
      header: t("status"),
      accessorFn: (step) => step.ticketStatus,
      cell: ({ row: { original } }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <ColorSwatch color={original.color} />
          {original.ticketStatus}
        </span>
      ),
    };
    const perType = types.map(
      (type, index): ColumnDef<PipelinePreviewStep> => ({
        id: `type-${type}`,
        header: type,
        accessorFn: (step) => step.lines[index]?.state ?? "",
        cell: ({ row: { original } }) => <LineCell line={original.lines[index]} />,
      }),
    );
    return [ticketStatus, ...perType];
  }, [t, types]);
}
