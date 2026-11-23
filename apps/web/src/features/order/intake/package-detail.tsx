import { Button, cn, VisualTile } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { IntakeWhen } from "./intake-state";
import type { PackageCompare, RoomsFit } from "./package-compare";
import { useGuestRange } from "./use-guest-range";

type Tone = "ok" | "warn" | "clash" | "muted";

const TONE: Record<Tone, string> = {
  ok: "text-success",
  warn: "text-warning-foreground",
  clash: "text-destructive",
  muted: "text-muted-foreground",
};

type Row = { label: string; asked: string; offered: string; mark: string; tone: Tone };

const roomsTone = ({ rooms }: { rooms: RoomsFit }): Tone =>
  rooms.kind === "CLASHES"
    ? "clash"
    : rooms.kind === "WARNINGS"
      ? "warn"
      : rooms.kind === "HIDDEN"
        ? "muted"
        : "ok";

/** The three rows: guests, time and rooms, each with what was asked and what the package does. */
function useRows({ compare, when }: { compare: PackageCompare; when: IntakeWhen }): Row[] {
  const t = useTranslations("orderIntake.package.compare");
  const dates = useDateTimeFormat();
  const range = useGuestRange();
  const { option } = compare.card;
  const { rooms, endsLater } = compare;
  const roomText =
    rooms.kind === "FREE" || rooms.kind === "HIDDEN"
      ? t(rooms.kind === "FREE" ? "free" : "hidden")
      : t(rooms.kind === "CLASHES" ? "clashes" : "warnings", { count: rooms.count });
  return [
    {
      label: t("guests"),
      asked: String(when.guests),
      offered: range({ min: option.minGuests, max: option.maxGuests }),
      mark: compare.guestsFit ? t("fits") : t("outsideRange"),
      tone: compare.guestsFit ? "ok" : "warn",
    },
    {
      label: t("time"),
      asked: `${when.from}–${when.to}`,
      offered: `${when.from}–${endsLater ? dates.time({ instant: endsLater }) : when.to}`,
      mark: endsLater ? t("runsLonger") : t("fits"),
      tone: endsLater ? "warn" : "ok",
    },
    {
      label: t("rooms"),
      asked: t("free"),
      offered: roomText,
      mark: rooms.kind === "FREE" ? t("fits") : rooms.kind === "HIDDEN" ? "" : t("change"),
      tone: roomsTone({ rooms }),
    },
  ];
}

export type PackageDetailProps = {
  compare: PackageCompare;
  when: IntakeWhen;
  picked: boolean;
  onPick: () => void;
};

/** One package beside the list: its lines, how it compares with the request, and Pick. */
export function PackageDetail({ compare, when, picked, onPick }: PackageDetailProps) {
  const t = useTranslations("orderIntake.package");
  const rows = useRows({ compare, when });
  const { option } = compare.card;
  return (
    <section className="grid content-start gap-4 rounded-lg border p-4" aria-label={option.name}>
      <div className="flex flex-wrap gap-2">
        {option.lines.map((line, index) => (
          <span
            // Lines may repeat a name; their position is stable within the package.
            // biome-ignore lint/suspicious/noArrayIndexKey: lines have no id here
            key={index}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted py-1 pr-2.5 pl-1.5 text-sm"
          >
            <VisualTile size="xs" src={line.imageUrl} icon={line.icon} className="bg-transparent" />
            {line.name}
          </span>
        ))}
      </div>
      <h3 className="text-base font-medium">{option.name}</h3>
      <dl className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-4 text-sm">
        <div className="contents text-muted-foreground" aria-hidden="true">
          <span />
          <span className="pb-2 font-medium">{t("compare.asked")}</span>
          <span className="pb-2 font-medium">{t("compare.package")}</span>
          <span />
        </div>
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="border-t py-2 text-muted-foreground">{row.label}</dt>
            <dd className="border-t py-2">{row.asked}</dd>
            <dd className={cn("border-t py-2 font-medium", TONE[row.tone])}>{row.offered}</dd>
            <dd className={cn("border-t py-2 text-right", TONE[row.tone])}>{row.mark}</dd>
          </div>
        ))}
      </dl>
      <Button
        type="button"
        className="justify-self-end"
        variant={picked ? "secondary" : "default"}
        onClick={onPick}
      >
        {picked ? t("pickedShort") : compare.changes === 0 ? t("pick") : t("pickAndAdjust")}
      </Button>
    </section>
  );
}
