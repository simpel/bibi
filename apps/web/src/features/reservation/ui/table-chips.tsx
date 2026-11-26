import { Button } from "@bibi/ui";
import type { TableChoice } from "../lib/table-choice";

export type TableChipsProps = {
  label: string;
  hint?: string | undefined;
  tables: readonly TableChoice[];
  value: readonly string[];
  onChange: (ids: string[]) => void;
};

/** Tables as toggle chips by number: the way to pick several without a multi-select. */
export function TableChips({ label, hint, tables, value, onChange }: TableChipsProps) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {tables.map((table) => {
          const on = value.includes(table.id);
          return (
            <Button
              key={table.id}
              type="button"
              size="sm"
              variant={on ? "default" : "outline"}
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((id) => id !== table.id) : [...value, table.id])
              }
            >
              {table.label || "–"}
              <span className="text-xs opacity-70">{table.seats}</span>
            </Button>
          );
        })}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}
