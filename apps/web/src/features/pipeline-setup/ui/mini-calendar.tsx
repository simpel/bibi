import type { PipelinePreviewLine, PipelinePreviewStep } from "@bibi/core/schemas";
import { cn, softHatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { HelpHint } from "@/components/help/help-hint";

export type MiniCalendarProps = { steps: PipelinePreviewStep[] };

/** How a line holds its item: solid for hard, hatched for soft, an outline for no hold. */
type HoldLook = Pick<PipelinePreviewLine, "color" | "released" | "hold">;

function holdStyle({ line }: { line: HoldLook }) {
  const color = line.color ?? "transparent";
  if (line.released || line.hold === "NONE") return { borderColor: color };
  if (line.hold === "HARD") return { backgroundColor: color, borderColor: color };
  return {
    borderColor: color,
    borderStyle: "dashed",
    backgroundImage: softHatch({ color }),
  } as const;
}

const SWATCH = "var(--muted-foreground)";

const SWATCH_LINES: Record<"solid" | "hatched" | "outline", HoldLook> = {
  solid: { hold: "HARD", color: SWATCH, released: false },
  hatched: { hold: "SOFT", color: SWATCH, released: false },
  outline: { hold: "NONE", color: SWATCH, released: false },
};

/** Swatches drawn with the slots' own styles, one word each; closed for good with its X. */
function MiniCalendarLegend() {
  const t = useTranslations("helpHints.setup-preview-legend");
  return (
    <HelpHint id="setup-preview-legend">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {(["solid", "hatched", "outline"] as const).map((key) => (
          <li key={key} title={t(`${key}.title`)} className="flex items-center gap-2">
            <span
              className="h-3 w-5 rounded-sm border"
              style={holdStyle({ line: SWATCH_LINES[key] })}
            />
            <span className="font-medium text-foreground">{t(`${key}.name`)}</span>
          </li>
        ))}
      </ul>
    </HelpHint>
  );
}

/**
 * A mini calendar of the simulated order (ADR 0044): one row per item type, one slot per status,
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
            const label = t("slot", { status: step.orderStatus, state: line.state ?? "-" });
            return (
              <span
                key={step.orderStatus}
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
      <MiniCalendarLegend />
    </figure>
  );
}
