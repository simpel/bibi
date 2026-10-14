import type { VocabularyDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { ValueRowActions } from "./value-row-actions";

export type ValueTableProps = { vocabulary: VocabularyDto; canWrite: boolean };

/** Active values of a list, in order. */
export async function ValueTable({ vocabulary, canWrite }: ValueTableProps) {
  const t = await getTranslations("vocabulary.value");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vocabulary.values.map((value) => (
          <TableRow key={value.id}>
            <TableCell className="font-medium">{value.name}</TableCell>
            <TableCell>
              {canWrite ? <ValueRowActions vocabularyId={vocabulary.id} value={value} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
