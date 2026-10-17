import type { JsonObject } from "@okazi/api";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";
import {
  isNullable,
  objectProperties,
  type SchemaProperty,
  schemaType,
} from "../reference/schema-type";

export type SchemaViewProps = { schema: JsonObject; depth?: number };

const MAX_DEPTH = 4;

function PropertyRow({ property, depth }: { property: SchemaProperty; depth: number }) {
  const t = useTranslations("docs.reference");
  const { name, schema, required } = property;
  const values = Array.isArray(schema.enum) ? (schema.enum as unknown[]) : [];
  const nested = depth < MAX_DEPTH ? objectProperties({ schema }) : undefined;
  return (
    <li className="grid gap-1 px-3 py-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <code className="font-mono text-sm font-medium">{name}</code>
        <span className="font-mono text-xs text-muted-foreground">{schemaType({ schema })}</span>
        {required && <Badge variant="outline">{t("required")}</Badge>}
        {isNullable({ schema }) && <Badge variant="secondary">{t("nullable")}</Badge>}
      </div>
      {typeof schema.description === "string" && (
        <p className="text-sm text-muted-foreground">{schema.description}</p>
      )}
      {values.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("oneOf")}{" "}
          {values.map((value) => (
            <code key={String(value)} className="mr-1 rounded bg-muted px-1 font-mono">
              {String(value)}
            </code>
          ))}
        </p>
      )}
      {nested && nested.length > 0 && <SchemaView schema={schema} depth={depth + 1} />}
    </li>
  );
}

/** JSON Schema as a readable field list (name, type, required, description, nested fields). */
export function SchemaView({ schema, depth = 0 }: SchemaViewProps) {
  const t = useTranslations("docs.reference");
  const properties = objectProperties({ schema });
  if (!properties) {
    return <code className="font-mono text-sm">{schemaType({ schema })}</code>;
  }
  if (properties.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noFields")}</p>;
  }
  return (
    <ul className="divide-y rounded-md border bg-background">
      {properties.map((property) => (
        <PropertyRow key={property.name} property={property} depth={depth} />
      ))}
    </ul>
  );
}
