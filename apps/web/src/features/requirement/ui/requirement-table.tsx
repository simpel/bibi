import type { RequirementDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import type { RequirementFormData } from "./requirement-form-data";
import { RequirementRowActions } from "./requirement-row-actions";

export type RequirementTableProps = {
  requirements: RequirementDto[];
  data: RequirementFormData;
  canWrite: boolean;
};

const COLUMNS = ["value", "where", "quantity", "type"] as const;

/** The booking's counts: list value, where it applies, how many and the requirement type. */
export async function RequirementTable({ requirements, data, canWrite }: RequirementTableProps) {
  const t = await getTranslations("requirement");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
          ))}
          <TableHead className="w-24">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requirements.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              {nameOf({ options: data.values, id: row.vocabularyValueId })}
            </TableCell>
            <TableCell>
              {row.programItemId
                ? nameOf({ options: data.programItems, id: row.programItemId })
                : t("wholeBooking")}
            </TableCell>
            <TableCell>{row.quantity}</TableCell>
            <TableCell>{nameOf({ options: data.types, id: row.entityTypeId })}</TableCell>
            <TableCell>
              {canWrite ? <RequirementRowActions requirement={row} data={data} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
