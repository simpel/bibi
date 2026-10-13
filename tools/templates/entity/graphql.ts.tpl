import type { {{Pascal}} } from "@okazi/core"; // TODO: exportera typen från packages/core/src/index.ts
import { builder } from "../../builder"; // TODO: Pothos-builder enligt packages/graphql/src

// {{Pascal}} i GraphQL-schemat. Läsningar via graph (ADR 0003). Mutationer går via core-operationer.
export const {{Pascal}}Type = builder.objectRef<{{Pascal}}>("{{Pascal}}").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    // TODO: exponera övriga fält från schema.ts
  }),
});

builder.queryField("{{camel}}", (t) =>
  t.field({
    type: {{Pascal}}Type,
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    // TODO: anropa get{{Pascal}} med org-kontexten och mappa AppError till GraphQL-fel.
    resolve: () => {
      throw new Error("TODO: koppla {{camel}} till get{{Pascal}}");
    },
  }),
);

builder.queryField("{{camel}}s", (t) =>
  t.field({
    type: [{{Pascal}}Type],
    // TODO: anropa list{{Pascal}}. Plural "{{camel}}s" är ett naivt förslag, korrigera vid behov.
    resolve: () => {
      throw new Error("TODO: koppla {{camel}}s till list{{Pascal}}");
    },
  }),
);
