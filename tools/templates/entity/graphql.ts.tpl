import {
  archive{{Pascal}},
  create{{Pascal}},
  get{{Pascal}},
  list{{Pascal}}s,
  type {{Pascal}}Dto,
  {{Pascal}}Schema,
  update{{Pascal}},
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

// GraphQL surface for {{Pascal}}. Everything is derived from the core operations' Zod schemas (ADR 0003):
// the object type from the output schema, arguments and mutation input from the input schema.
// Remember: add `import "../features/{{kebab}}/graphql";` to packages/graphql/src/schema/schema.ts.
export const {{Pascal}}Ref = objectFromSchema<{{Pascal}}Dto>({
  name: "{{Pascal}}",
  schema: {{Pascal}}Schema,
  omit: ["organizationId"],
  description: "TODO: describe {{Pascal}} for the schema docs.",
});
const {{Pascal}}PageRef = pageType({ name: "{{Pascal}}Page", item: {{Pascal}}Ref });

fieldFromOperation({ operation: list{{Pascal}}s, type: {{Pascal}}PageRef, name: "{{camel}}s" });
fieldFromOperation({ operation: get{{Pascal}}, type: {{Pascal}}Ref, name: "{{camel}}" });
mutationFromOperation({ operation: create{{Pascal}}, type: {{Pascal}}Ref });
mutationFromOperation({ operation: update{{Pascal}}, type: {{Pascal}}Ref });
mutationFromOperation({ operation: archive{{Pascal}}, type: {{Pascal}}Ref });

// Relations (graph): add with builder.objectField({{Pascal}}Ref, "<field>", ...).
// Searchable entity: add a line to LOADERS in packages/graphql/src/schema/search-entity.ts.
