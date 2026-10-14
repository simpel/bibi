"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { entityTypeRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type EntityTypeTableViewProps = GenerativeProps<"entity-type-table">;

/** A page of types; each name links to the type's settings page. */
export function EntityTypeTableView({ items, nextCursor }: EntityTypeTableViewProps) {
  const t = useTranslations("assistant.ui.entityType");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="entity-type-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.base")}</TableHead>
            <TableHead>{t("columns.behaviours")}</TableHead>
            <TableHead>{t("columns.fields")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">
                <Link href={entityTypeRoute({ id: type.id })} className="hover:underline">
                  {type.name}
                </Link>
              </TableCell>
              <TableCell>{t(`base.${type.base}`)}</TableCell>
              <TableCell>
                {type.behaviours.map((behaviour) => t(`behaviour.${behaviour}`)).join(", ") || "–"}
              </TableCell>
              <TableCell>{type.fields.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
