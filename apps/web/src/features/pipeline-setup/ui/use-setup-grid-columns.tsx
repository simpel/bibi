import type { PipelineCellDraft } from "@okazi/core/schemas";
import { ColorSwatch, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { SetupPhaseValues, SetupTypeValues } from "./setup-form-schema";
import { KEEP, SetupGridCell } from "./setup-grid-cell";

export type SetupGridColumnsInput = {
  itemTypes: SetupTypeValues[];
  cells: PipelineCellDraft[];
  onChange: (cells: PipelineCellDraft[]) => void;
};

type CellRef = { cells: PipelineCellDraft[]; phase: string; type: string };

/** The state a cell sets, or `KEEP`. */
const stateOf = ({ cells, phase, type }: CellRef) =>
  cells.find((cell) => cell.phase === phase && cell.type === type)?.state ?? KEEP;

type SetInput = CellRef & { onChange: SetupGridColumnsInput["onChange"]; value: string };

/** The cells with one cell set to a state, or removed for "keep". */
function setCell({ cells, onChange, phase, type, value }: SetInput) {
  const others = cells.filter((cell) => !(cell.phase === phase && cell.type === type));
  onChange(value === KEEP ? others : [...others, { phase, type, state: value }]);
}

/** The phase column, then one column per item type with a dropdown of its states or "keep". */
export function useSetupGridColumns({
  itemTypes,
  cells,
  onChange,
}: SetupGridColumnsInput): ColumnDef<SetupPhaseValues>[] {
  const t = useTranslations("phaseGrid");
  return useMemo(() => {
    const phase: ColumnDef<SetupPhaseValues> = {
      id: "phase",
      header: t("phase"),
      accessorFn: (row) => row.name,
      cell: ({ row: { original } }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <ColorSwatch color={original.color} />
          {original.name}
        </span>
      ),
    };
    const perType = itemTypes.map(
      (type): ColumnDef<SetupPhaseValues> => ({
        id: `type-${type.name}`,
        header: type.name,
        accessorFn: (row) => stateOf({ cells, phase: row.name, type: type.name }),
        cell: ({ row: { original } }) => {
          if (original.terminal) {
            return <span className="text-sm text-muted-foreground">{t("terminal")}</span>;
          }
          const ref = { cells, phase: original.name, type: type.name };
          const change = ({ value }: { value: string }) => setCell({ ...ref, onChange, value });
          return (
            <SetupGridCell {...ref} states={type.states} value={stateOf(ref)} onChange={change} />
          );
        },
      }),
    );
    return [phase, ...perType];
  }, [t, itemTypes, cells, onChange]);
}
