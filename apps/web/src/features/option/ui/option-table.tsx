import type { OptionDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { OptionStatusBadge } from "./option-status-badge";
import { ReleaseOptionButton } from "./release-option-button";

export type OptionTableProps = { options: OptionDto[]; canWrite: boolean };

/** The queue: rank, held period, expiry and note; active options can be released. */
export async function OptionTable({ options, canWrite }: OptionTableProps) {
  const t = await getTranslations("option");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const when = ({ date }: { date: Date }) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">{t("columns.rank")}</TableHead>
          <TableHead>{t("columns.startsAt")}</TableHead>
          <TableHead>{t("columns.endsAt")}</TableHead>
          <TableHead>{t("columns.expiresAt")}</TableHead>
          <TableHead>{t("columns.note")}</TableHead>
          <TableHead className="w-16">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {options.map((option) => (
          <TableRow key={option.id}>
            <TableCell>
              <OptionStatusBadge status={option.optionStatus} rank={option.rank} />
            </TableCell>
            <TableCell>{when({ date: option.startsAt })}</TableCell>
            <TableCell>{when({ date: option.endsAt })}</TableCell>
            <TableCell>{when({ date: option.expiresAt })}</TableCell>
            <TableCell>{option.note ?? "–"}</TableCell>
            <TableCell>{canWrite ? <ReleaseOptionButton option={option} /> : null}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
