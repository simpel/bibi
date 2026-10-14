"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { entityTypeRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type FieldDefinitionTableViewProps = GenerativeProps<"field-definition-table">;

/** A page of fields; each name links to the type the field belongs to. */
export function FieldDefinitionTableView({ items, nextCursor }: FieldDefinitionTableViewProps) {
  const t = useTranslations("assistant.ui.field");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="field-definition-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.kind")}</TableHead>
            <TableHead>{t("columns.required")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((field) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium">
                <Link
                  href={entityTypeRoute({ id: field.entityTypeId })}
                  className="hover:underline"
                >
                  {field.name}
                </Link>
              </TableCell>
              <TableCell>{t(`kind.${field.kind}`)}</TableCell>
              <TableCell>{field.required ? t("yes") : "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
