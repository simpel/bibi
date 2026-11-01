import type { DashboardSummary, NumberFormat } from "@bibi/core/schemas";
import type { RateBarRow } from "@bibi/ui";

export type UtilisationRowsInput = {
  utilisation: NonNullable<DashboardSummary["utilisation"]>;
  numbers: NumberFormat;
  /** `dashboard.utilisation.text`. */
  text: (values: { rate: string; booked: string; open: string }) => string;
  /** `dashboard.utilisation.closed`: a type with no open hours has no rate. */
  closed: string;
};

/** The rate as a share from 0 to 100; booked and open hours go in the tooltip and the table. */
export function utilisationRows({ utilisation, numbers, text, closed }: UtilisationRowsInput) {
  const hours = ({ minutes }: { minutes: number }) =>
    numbers.number({ value: minutes / 60, maximumFractionDigits: 1 });
  return utilisation.map((row): RateBarRow => {
    if (row.rate === null) return { label: row.name, point: { value: 0, text: closed } };
    const percent = Math.round(row.rate * 100);
    return {
      label: row.name,
      point: {
        value: Math.min(100, percent),
        text: text({
          rate: `${numbers.number({ value: percent })} %`,
          booked: hours({ minutes: row.bookedMinutes }),
          open: hours({ minutes: row.openMinutes }),
        }),
      },
    };
  });
}
