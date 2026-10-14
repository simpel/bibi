import type { EntityTypeDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { entityTypeRoute } from "@/lib/configuration-routes";

export type EntityTypeTableProps = { types: EntityTypeDto[] };

/** Types of one base entity: name (link to the detail page), behaviours and field count. */
export async function EntityTypeTable({ types }: EntityTypeTableProps) {
  const t = await getTranslations("entityType");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.behaviours")}</TableHead>
          <TableHead>{t("columns.fields")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {types.map((type) => (
          <TableRow key={type.id}>
            <TableCell className="font-medium">
              <Link href={entityTypeRoute({ id: type.id })} className="hover:underline">
                {type.name}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {type.behaviours.map((behaviour) => (
                  <Badge key={behaviour} variant="outline">
                    {t(`behaviours.${behaviour}`)}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{t("fieldCount", { count: type.fields.length })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
