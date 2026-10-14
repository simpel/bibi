"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { vocabularyRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type VocabularyTableViewProps = GenerativeProps<"vocabulary-table">;

/** A page of lists; each name links to the list page. */
export function VocabularyTableView({ items, nextCursor }: VocabularyTableViewProps) {
  const t = useTranslations("assistant.ui.vocabulary");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="vocabulary-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.values")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((vocabulary) => (
            <TableRow key={vocabulary.id}>
              <TableCell className="font-medium">
                <Link href={vocabularyRoute({ id: vocabulary.id })} className="hover:underline">
                  {vocabulary.name}
                </Link>
              </TableCell>
              <TableCell>{vocabulary.values.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
