import { actionsColumn, Badge, ColorSwatch, type ColumnDef, createTableColumns } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ItemStateRowActions, itemStateEditHref } from "./item-state-row-actions";
import type { StateRow, TypedStateRow } from "./state-rows";

type Column = ColumnDef<TypedStateRow>;

type Translate = ReturnType<typeof useTranslations<"itemState">>;

/** The flags of a row as text; `hold` reads as its kind (soft or hard). */
export const flagLabels = ({ t, row }: { t: Translate; row: StateRow }) =>
  row.flags.map((flag) => (flag === "hold" ? t(`holds.${row.state.hold}`) : t(`flags.${flag}`)));

function StateName({ row, canEdit }: { row: StateRow; canEdit: boolean }) {
  const label = (
    <span className="inline-flex items-center gap-2 font-medium">
      <ColorSwatch color={row.state.color} />
      {row.state.name}
    </span>
  );
  if (!canEdit) return label;
  return (
    <Link href={itemStateEditHref({ id: row.state.id })} className="hover:underline">
      {label}
    </Link>
  );
}

export type StateColumnsInput = { access: RowAccess };

/** Name (with color), item type, what the state does, where a line may go next; admins get actions. */
export function useStateColumns({ access }: StateColumnsInput): Column[] {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  return useMemo<Column[]>(
    () =>
      createTableColumns<TypedStateRow>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (row) => row.state.name,
            cell: ({ row }) => <StateName row={row.original} canEdit={access.canEdit} />,
          },
        ],
        relations: [
          { id: "type", header: t("columns.type"), accessorFn: (row) => row.typeName },
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
        ],
        actions:
          access.canEdit || access.canRemove
            ? [
                actionsColumn<TypedStateRow>({
                  label: common("actions"),
                  cell: ({ state, index, siblings }) => (
                    <ItemStateRowActions
                      state={state}
                      index={index}
                      states={siblings}
                      access={access}
                    />
                  ),
                }),
              ]
            : [],
      }),
    [t, common, access],
  );
}
