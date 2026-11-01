import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table/table";
import type { ChartRow, ChartSeries } from "./chart-model";

export type ChartDataTableProps = {
  caption: string;
  /** The heading of the category column. */
  categoryLabel: string;
  series: ChartSeries[];
  rows: ChartRow[];
};

/** The chart's numbers for screen readers: a chart is an image to them (`ChartContainer`). */
export function ChartDataTable({ caption, categoryLabel, series, rows }: ChartDataTableProps) {
  return (
    <div data-slot="chart-data-table" className="sr-only">
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{categoryLabel}</TableHead>
            {series.map(({ label }) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ label, points }) => (
            <TableRow key={label}>
              <TableCell>{label}</TableCell>
              {points.map((point, index) => (
                <TableCell key={series[index]?.label ?? index}>{point.text}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
