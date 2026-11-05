import { ChoiceCard } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { type CardNote, cardNotes, type PackageCardData } from "./package-groups";

const TONE: Record<CardNote["tone"], string> = {
  ok: "text-success",
  warn: "text-warning-foreground",
  clash: "text-destructive",
  muted: "text-muted-foreground",
};

/** The guest range as "8–20 guests", "From 8 guests", "Up to 20 guests" or "Any number". */
export function useGuestRange() {
  const t = useTranslations("orderIntake.package");
  return ({ min, max }: { min: number | null; max: number | null }) => {
    if (min !== null && max !== null) return t("range.both", { min, max });
    if (min !== null) return t("range.min", { min });
    if (max !== null) return t("range.max", { max });
    return t("range.any");
  };
}

function NoteText({ note, range }: { note: CardNote; range: string }) {
  const t = useTranslations("orderIntake.package.notes");
  const dates = useDateTimeFormat();
  if (note.kind === "AVAILABLE") return t("available");
  if (note.kind === "HIDDEN") return t("hidden");
  if (note.kind === "WARNINGS") return t("warnings", { count: note.count });
  if (note.kind === "CLASHES") return t("clashes", { count: note.count });
  if (note.kind === "GUESTS_OUTSIDE") return t("guests", { range, headcount: note.headcount });
  return t("pastEnd", { time: dates.time({ instant: note.endsAt }) });
}

export type PackageCardProps = {
  card: PackageCardData;
  headcount: number;
  availabilityHidden: boolean;
  selected: boolean;
  /** Suggested by a read message: "★ Suggested from the email" (ADR 0084). */
  suggested?: boolean;
  onPick: () => void;
};

/** A package: name, its lines as the summary, the guest range and the preview's notes. */
export function PackageCard({
  card,
  headcount,
  availabilityHidden,
  selected,
  suggested = false,
  onPick,
}: PackageCardProps) {
  const t = useTranslations("orderIntake.message");
  const range = useGuestRange()({ min: card.option.minGuests, max: card.option.maxGuests });
  const notes = cardNotes({ entry: card.entry, headcount, availabilityHidden });
  return (
    <ChoiceCard title={card.option.name} selected={selected} onClick={onPick}>
      {suggested ? <span className="font-medium text-primary">{t("suggested")}</span> : null}
      <span className="line-clamp-2 text-muted-foreground">
        {card.option.lineNames.join(" · ")}
      </span>
      <span className="text-muted-foreground">{range}</span>
      <ul className="grid gap-0.5">
        {notes.map((note) => (
          <li key={note.kind} className={TONE[note.tone]}>
            <NoteText note={note} range={range} />
          </li>
        ))}
      </ul>
    </ChoiceCard>
  );
}
