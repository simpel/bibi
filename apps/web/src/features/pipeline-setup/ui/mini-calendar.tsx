import type { PipelinePreviewLine, PipelinePreviewStep } from "@bibi/core/schemas";
import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type MiniCalendarProps = { steps: PipelinePreviewStep[] };

/** How a line holds its item: solid for hard, hatched for soft, an outline for no hold. */
function holdStyle({ line }: { line: PipelinePreviewLine }) {
  const color = line.color ?? "transparent";
  if (line.released || line.hold === "NONE") return { borderColor: color };
  if (line.hold === "HARD") return { backgroundColor: color, borderColor: color };
  return {
    borderColor: color,
    backgroundImage: `repeating-linear-gradient(45deg, ${color} 0 4px, transparent 4px 8px)`,
  };
}

/**
 * A mini calendar of the simulated ticket (ADR 0044): one row per item type, one slot per status,
 * each slot drawn as the line's hold in its state's color, like the calendar draws occupancy.
 */
export function MiniCalendar({ steps }: MiniCalendarProps) {
  const t = useTranslations("pipelineSetup.preview");
  const types = steps[0]?.lines.map((line) => line.type) ?? [];
  return (
    <figure className="grid gap-2 overflow-x-auto">
      <figcaption className="text-sm font-medium">{t("calendar")}</figcaption>
      {types.map((type, row) => (
        <div key={type} className="flex items-center gap-1">
          <span className="w-32 shrink-0 truncate text-xs">{type}</span>
          {steps.map((step) => {
            const line = step.lines[row];
            if (!line) return null;
            const label = t("slot", { status: step.ticketStatus, state: line.state ?? "-" });
            return (
              <span
                key={step.ticketStatus}
                title={label}
                aria-label={label}
                role="img"
                style={holdStyle({ line })}
                className={cn("h-5 min-w-10 flex-1 rounded-sm border", step.closes && "opacity-60")}
              />
            );
          })}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("legend")}</p>
    </figure>
  );
}
