import { STATE_FLAGS } from "@bibi/core/schemas";
import { ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { ItemStateTableViewProps } from "./item-state-table-view";

type Row = ItemStateTableViewProps["items"][number];

/** "Soft hold, Initial, In sheets": the hold kind (unless none) and the flags that are set. */
export function useStateFlagLabels() {
  const t = useTranslations("itemState");
  return useCallback(
    ({ state }: { state: Row }) =>
      [
        ...(state.hold === "NONE" ? [] : [t(`holds.${state.hold}`)]),
        ...STATE_FLAGS.filter((flag) => state[flag]).map((flag) => t(`flags.${flag}`)),
      ].join(", "),
    [t],
  );
}

/** Name (link to the type), flags and transition count of the states in the chat card. */
export function useItemStateViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.itemState");
  const flagLabels = useStateFlagLabels();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (state) => state.name,
        cell: ({ row: { original: state } }) => (
          <Link
            href={entityTypeRoute({ id: state.entityTypeId })}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <ColorSwatch color={state.color} />
            {state.name}
          </Link>
        ),
      },
      {
        id: "flags",
        header: t("columns.flags"),
        accessorFn: (state) => flagLabels({ state }),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (state) => state.transitionsTo.length,
        cell: ({ row }) => t("transitions", { count: row.original.transitionsTo.length }),
      },
    ],
    [t, flagLabels],
  );
}
