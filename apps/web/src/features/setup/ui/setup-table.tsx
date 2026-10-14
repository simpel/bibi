import type { SetupDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { SetupRowActions } from "./setup-row-actions";

export type SetupTableProps = { setups: SetupDto[]; canWrite: boolean };

/** Setups of the organization with their changeover time. */
export async function SetupTable({ setups, canWrite }: SetupTableProps) {
  const t = await getTranslations("setup");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.changeover")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {setups.map((setup) => (
          <TableRow key={setup.id}>
            <TableCell className="font-medium">{setup.name}</TableCell>
            <TableCell>{t("changeoverValue", { minutes: setup.changeoverMinutes })}</TableCell>
            <TableCell>{canWrite ? <SetupRowActions setup={setup} /> : null}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
