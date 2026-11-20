import type { DateTimeFormat } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { CommentLines } from "@/features/comment/ui/comment-lines";
import type { ChangeMark, RunSheetTaskRow } from "../document-rows";

type Column = ColumnDef<RunSheetTaskRow>;

/** An included field of the run sheet: its key in the row's values and its name. */
export type RunSheetFieldColumn = { key: string; name: string };

export type UseRunSheetTaskColumnsInput = {
  fields: readonly RunSheetFieldColumn[];
  /** The viewer's date and time format, for the comments' times. */
  dates: DateTimeFormat;
};

/** ★ for a row added or changed since the last sent version; a removed row is struck through. */
export function ChangeCell({ change }: { change: ChangeMark }) {
  const t = useTranslations("runSheet");
  if (!change) return null;
  const label = t(`change.${change}`);
  return (
    <span role="img" aria-label={label} title={label} className="text-amber-600">
      ★
    </span>
  );
}

function NameCell({ row }: { row: RunSheetTaskRow }) {
  const t = useTranslations("runSheet");
  const name = row.addOnTo ? t("addOnTo", { name: row.name, parent: row.addOnTo }) : row.name;
  return <span className={row.change === "REMOVED" ? "line-through" : "font-medium"}>{name}</span>;
}

/** ★ · when · what · item · quantity, one column per included field, then the comments. */
export function useRunSheetTaskColumns({ fields, dates }: UseRunSheetTaskColumnsInput): Column[] {
  const t = useTranslations("runSheet.document.columns");
  const comment = useTranslations("comment");
  return useMemo<Column[]>(
    () => [
      {
        id: "change",
        header: "★",
        accessorFn: (row) => row.change ?? "",
        cell: ({ row }) => <ChangeCell change={row.original.change} />,
      },
      {
        id: "when",
        header: t("when"),
        accessorFn: (row) => row.startsAt ?? "",
        cell: ({ row }) => row.original.when,
      },
      {
        id: "name",
        header: t("name"),
        accessorFn: (row) => row.name,
        cell: ({ row }) => <NameCell row={row.original} />,
      },
      { id: "item", header: t("item"), accessorFn: (row) => row.item },
      { id: "quantity", header: t("quantity"), accessorFn: (row) => row.quantity ?? "" },
      ...fields.map<Column>((field) => ({
        id: `field.${field.key}`,
        header: field.name,
        accessorFn: (row) => row.fields[field.key] ?? "",
      })),
      {
        id: "comments",
        header: t("comments"),
        accessorFn: (row) => row.comments.map((c) => c.body).join(" "),
        cell: ({ row }) => (
          <CommentLines
            comments={row.original.comments}
            dates={dates}
            formerMember={comment("formerMember")}
          />
        ),
      },
    ],
    [t, comment, fields, dates],
  );
}
