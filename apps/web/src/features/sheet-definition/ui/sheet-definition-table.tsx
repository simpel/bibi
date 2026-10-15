import type { SheetDefinitionDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { SheetDefinitionRowActions } from "./sheet-definition-row-actions";
import { namesOf, type SheetOptions } from "./sheet-options";

export type SheetDefinitionTableProps = {
  sheets: SheetDefinitionDto[];
  options: SheetOptions;
  canWrite: boolean;
};

type NamesInput = { ids: readonly string[]; options: SheetOptions[keyof SheetOptions] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

type SheetRowProps = { sheet: SheetDefinitionDto; options: SheetOptions; canWrite: boolean };

function SheetRow({ sheet, options, canWrite }: SheetRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{sheet.name}</TableCell>
      <TableCell>{names({ ids: sheet.entityTypeIds, options: options.types })}</TableCell>
      <TableCell>{names({ ids: sheet.vocabularyIds, options: options.lists })}</TableCell>
      <TableCell>{names({ ids: [sheet.roleId], options: options.roles })}</TableCell>
      <TableCell>
        {canWrite ? <SheetDefinitionRowActions sheet={sheet} options={options} /> : null}
      </TableCell>
    </TableRow>
  );
}

/** The organization's sheets: what each includes and which role it goes to. */
export async function SheetDefinitionTable({
  sheets,
  options,
  canWrite,
}: SheetDefinitionTableProps) {
  const t = await getTranslations("sheetDefinition");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.types")}</TableHead>
          <TableHead>{t("columns.lists")}</TableHead>
          <TableHead>{t("columns.role")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sheets.map((sheet) => (
          <SheetRow key={sheet.id} sheet={sheet} options={options} canWrite={canWrite} />
        ))}
      </TableBody>
    </Table>
  );
}
