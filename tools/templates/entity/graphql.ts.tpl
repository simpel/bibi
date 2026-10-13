import {
  archive{{Pascal}},
  create{{Pascal}},
  get{{Pascal}},
  list{{Pascal}}s, // TODO: bekräfta pluralnamnet som core exporterar (t.ex. listVenues)
  type {{Pascal}}Dto, // TODO: exportera typen från packages/core (z.infer av {{camel}}Schema)
  {{camel}}Schema, // TODO: bekräfta exportnamnet (t.ex. VenueSchema)
  update{{Pascal}},
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

// GraphQL-yta för {{Pascal}}. Allt härleds från core-operationernas Zod-scheman (ADR 0003):
// objekttypen från utdataschemat, argument och mutation-input från indataschemat.
// Läsningar och mutationer går via core `execute`, aldrig egen logik här.
// Kom ihåg: lägg till `import "../features/{{kebab}}/graphql";` i packages/graphql/src/schema/schema.ts.
export const {{Pascal}}Ref = objectFromSchema<{{Pascal}}Dto>({
  name: "{{Pascal}}",
  schema: {{camel}}Schema,
  omit: ["organizationId"],
});
const {{Pascal}}PageRef = pageType({ name: "{{Pascal}}Page", item: {{Pascal}}Ref });

fieldFromOperation({ operation: list{{Pascal}}s, type: {{Pascal}}PageRef, name: "{{camel}}s" });
fieldFromOperation({ operation: get{{Pascal}}, type: {{Pascal}}Ref, name: "{{camel}}" });
mutationFromOperation({ operation: create{{Pascal}}, type: {{Pascal}}Ref });
mutationFromOperation({ operation: update{{Pascal}}, type: {{Pascal}}Ref });
mutationFromOperation({ operation: archive{{Pascal}}, type: {{Pascal}}Ref });

// Relationer (graph): lägg till med builder.objectField({{Pascal}}Ref, "<fält>", ...) och läs via
// ctx.core.db (org-scopad) efter requirePermission({ ctx, permission: "<resurs>:read" }).
// Sökbar entitet: lägg en rad i LOADERS i packages/graphql/src/schema/search-entity.ts.
