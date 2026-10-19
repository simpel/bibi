import type { ItemStateDto } from "@okazi/core/schemas";
import { actionsColumn, Badge, ColorSwatch, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { ItemStateRowActions } from "./item-state-row-actions";
import type { StateRow } from "./state-rows";

type Column = ColumnDef<StateRow>;

type Translate = ReturnType<typeof useTranslations<"itemState">>;

/** The flags of a row as text; `hold` reads as its kind (soft or hard). */
const flagLabels = ({ t, row }: { t: Translate; row: StateRow }) =>
  row.flags.map((flag) => (flag === "hold" ? t(`holds.${row.state.hold}`) : t(`flags.${flag}`)));

const nameColumn = ({ t }: { t: Translate }): Column => ({
  id: "name",
  header: t("columns.name"),
  accessorFn: (row) => row.state.name,
  cell: ({ row: { original: row } }) => (
    <span className="inline-flex items-center gap-2 font-medium">
      <ColorSwatch color={row.state.color} />
      {row.state.name}
    </span>
  ),
});

export type StateColumnsInput = { states: readonly ItemStateDto[]; access: RowAccess };

/** Name (with color), what the state does, and where a line may go next; admins get row actions. */
export function useStateColumns({ states, access }: StateColumnsInput): Column[] {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      nameColumn({ t }),
      {
        id: "flags",
        header: t("columns.flags"),
        accessorFn: (row) => flagLabels({ t, row }).join(", "),
        cell: ({ row: { original: row } }) => (
          <span className="flex flex-wrap gap-1">
            {flagLabels({ t, row }).map((text) => (
              <Badge key={text} variant="outline">
                {text}
              </Badge>
            ))}
          </span>
        ),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (row) => row.targets.join(", ") || t("noTransitions"),
      },
    ];
    if (!access.canEdit && !access.canRemove) return columns;
    const actions = actionsColumn<StateRow>({
      label: common("actions"),
      cell: ({ state, index }) => (
        <ItemStateRowActions state={state} index={index} states={states} access={access} />
      ),
    });
    return [...columns, actions];
  }, [t, common, states, access]);
}
