"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { sheetDefinitionsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SheetDefinitionTableViewProps = GenerativeProps<"sheet-definition-table">;

/** A page of sheet definitions; names link to the sheets settings page. */
export function SheetDefinitionTableView({ items, nextCursor }: SheetDefinitionTableViewProps) {
  const t = useTranslations("assistant.ui.sheetDefinition");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="sheet-definition-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.contents")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((sheet) => (
            <TableRow key={sheet.id}>
              <TableCell className="font-medium">
                <Link href={sheetDefinitionsRoute()} className="hover:underline">
                  {sheet.name}
                </Link>
              </TableCell>
              <TableCell>
                {t("contents", {
                  types: sheet.entityTypeIds.length,
                  fields: sheet.fieldIds.length,
                  lists: sheet.vocabularyIds.length,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
