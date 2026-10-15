import type { FieldDefinitionDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { FieldRowActions } from "./field-row-actions";
import type { VocabularyChoice } from "./field-source-fields";

export type FieldTableProps = {
  fields: FieldDefinitionDto[];
  vocabularies: VocabularyChoice[];
  linkTypes: VocabularyChoice[];
  canWrite: boolean;
};

type FieldRowProps = FieldTableProps & { index: number };

/** One field: name, kind, required, where its alternatives come from, and the row actions. */
async function FieldRow({ fields, vocabularies, linkTypes, canWrite, index }: FieldRowProps) {
  const t = await getTranslations("fieldDefinition");
  const common = await getTranslations("common");
  const field = fields[index] as FieldDefinitionDto;
  const list = vocabularies.find(({ id }) => id === field.vocabularyId);
  const target = linkTypes.find(({ id }) => id === field.linkTypeId);
  const source = list
    ? t("listSource", { name: list.name })
    : target
      ? t("linkSource", { name: target.name })
      : field.options.length > 0
        ? t("optionsSource", { count: field.options.length })
        : "–";
  return (
    <TableRow>
      <TableCell className="font-medium">{field.name}</TableCell>
      <TableCell>{t(`kinds.${field.kind}`)}</TableCell>
      <TableCell>{field.required ? common("yes") : common("no")}</TableCell>
      <TableCell>{source}</TableCell>
      <TableCell>
        {canWrite ? (
          <FieldRowActions
            field={field}
            previous={fields[index - 1]}
            next={fields[index + 1]}
            vocabularies={vocabularies}
            linkTypes={linkTypes}
          />
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/** Fields of a type in display order. */
export async function FieldTable(props: FieldTableProps) {
  const t = await getTranslations("fieldDefinition");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.kind")}</TableHead>
          <TableHead>{t("columns.required")}</TableHead>
          <TableHead>{t("columns.source")}</TableHead>
          <TableHead className="w-36">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.fields.map((field, index) => (
          <FieldRow key={field.id} {...props} index={index} />
        ))}
      </TableBody>
    </Table>
  );
}
