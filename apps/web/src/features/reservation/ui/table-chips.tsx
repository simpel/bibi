import { Button } from "@bibi/ui";
import { UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("reservation.create");
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {tables.map((table) => {
          const on = value.includes(table.id);
          return (
            <Button
              key={table.id}
              type="button"
              className="h-12 w-full gap-2 px-2 text-base"
              variant={on ? "default" : "outline"}
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((id) => id !== table.id) : [...value, table.id])
              }
            >
              {table.label || "–"}
              <span
                className="flex items-center gap-0.5 text-sm opacity-70"
                title={t("tableSeats", { count: table.seats })}
              >
                <UsersIcon className="size-4" aria-hidden />
                <span className="sr-only">{t("tableSeats", { count: table.seats })}</span>
                <span aria-hidden>{table.seats}</span>
              </span>
            </Button>
          );
        })}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}
