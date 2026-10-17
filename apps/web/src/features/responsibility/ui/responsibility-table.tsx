import type { ResponsibilityDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { namesOf } from "@/features/sheet-definition/ui/sheet-options";
import type { ResponsibilityOption, ResponsibilityOptions } from "./responsibility-options";
import { ResponsibilityRowActions } from "./responsibility-row-actions";

export type ResponsibilityTableProps = {
  responsibilities: ResponsibilityDto[];
  options: ResponsibilityOptions;
  canWrite: boolean;
};

type NamesInput = { ids: readonly string[]; options: readonly ResponsibilityOption[] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

type RowProps = {
  responsibility: ResponsibilityDto;
  options: ResponsibilityOptions;
  canWrite: boolean;
};

function ResponsibilityRow({ responsibility, options, canWrite }: RowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{responsibility.name}</TableCell>
      <TableCell>{names({ ids: responsibility.entityTypeIds, options: options.types })}</TableCell>
      <TableCell>
        {names({ ids: [responsibility.defaultAssigneeId], options: options.people })}
      </TableCell>
      <TableCell>
        {names({ ids: responsibility.defaultFollowerIds, options: options.people })}
      </TableCell>
      <TableCell>
        {canWrite ? (
          <ResponsibilityRowActions responsibility={responsibility} options={options} />
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/** The organization's responsibilities: what each covers and who answers for it by default. */
export async function ResponsibilityTable({
  responsibilities,
  options,
  canWrite,
}: ResponsibilityTableProps) {
  const t = await getTranslations("responsibility");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.types")}</TableHead>
          <TableHead>{t("columns.assignee")}</TableHead>
          <TableHead>{t("columns.followers")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {responsibilities.map((responsibility) => (
          <ResponsibilityRow
            key={responsibility.id}
            responsibility={responsibility}
            options={options}
            canWrite={canWrite}
          />
        ))}
      </TableBody>
    </Table>
  );
}
