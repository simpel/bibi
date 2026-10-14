import type { VocabularyDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { vocabularyRoute } from "@/lib/configuration-routes";
import { VocabularyRowActions } from "./vocabulary-row-actions";

export type VocabularyTableProps = { vocabularies: VocabularyDto[]; canWrite: boolean };

/** Lists of the organization with their value counts; names link to the detail page. */
export async function VocabularyTable({ vocabularies, canWrite }: VocabularyTableProps) {
  const t = await getTranslations("vocabulary");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.values")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vocabularies.map((vocabulary) => (
          <TableRow key={vocabulary.id}>
            <TableCell className="font-medium">
              <Link href={vocabularyRoute({ id: vocabulary.id })} className="hover:underline">
                {vocabulary.name}
              </Link>
            </TableCell>
            <TableCell>{t("valueCount", { count: vocabulary.values.length })}</TableCell>
            <TableCell>
              {canWrite ? <VocabularyRowActions vocabulary={vocabulary} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
