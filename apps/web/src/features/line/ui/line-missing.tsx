import type { LineDto } from "@bibi/core";
import { MissingButton, MissingMark } from "@bibi/ui";
import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"line">>;

/** A line with an item and no time: the day view stripes it across the day (`order-day-model`). */
export const lacksTime = ({ line }: { line: LineDto }) =>
  line.itemId !== null && (!line.startsAt || !line.endsAt);

/** The names of the line's required groups with nothing chosen (`UNCHOSEN_REQUIRED_GROUP`). */
export function openGroupNames({
  line,
  groupNames,
}: {
  line: LineDto;
  groupNames: ReadonlyMap<string, string>;
}) {
  return line.warnings
    .filter(({ kind }) => kind === "UNCHOSEN_REQUIRED_GROUP")
    .flatMap(({ id }) => {
      const name = id ? groupNames.get(id) : undefined;
      return name ? [name] : [];
    });
}

export type MissingCellProps = {
  label: string;
  /** Opens the line where it is filled in; without it the mark is only shown. */
  onOpen?: (() => void) | undefined;
};

/** What a line still lacks, in the program's amber stripes; a button when it can be filled in. */
export function MissingCell({ label, onOpen }: MissingCellProps) {
  if (!onOpen)
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-warning-foreground">
        <MissingMark />
        {label}
      </span>
    );
  return (
    <MissingButton
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      {label}
    </MissingButton>
  );
}

/** "Pick Main course", or "Choice open" when the group's name is not known here. */
export const pickLabel = ({ t, names }: { t: Translator; names: readonly string[] }) =>
  names.length > 0
    ? t("missing.pick", { groups: names.join(", ") })
    : t("warningsShort.UNCHOSEN_REQUIRED_GROUP");
