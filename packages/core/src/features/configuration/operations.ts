import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { getConfigurationTemplate } from "../../templates/configuration/configuration-templates";
import { importLists } from "./import-lists";
import { importResponsibilities } from "./import-responsibilities";
import { importTypes } from "./import-types";
import {
  ConfigurationImportTemplateInputSchema,
  ConfigurationImportTemplateOutputSchema,
} from "./schema";

export const importConfigurationTemplate = defineOperation({
  name: "configuration.importTemplate",
  kind: "command",
  description:
    "Import a starter configuration (e.g. conference-venue) as ordinary, editable lists, " +
    "types with capabilities and fields, and example responsibilities (defaulting to you " +
    "when you are a member). Idempotent: anything whose name already " +
    "exists is skipped and left untouched, so it is safe to run again.",
  input: ConfigurationImportTemplateInputSchema,
  output: ConfigurationImportTemplateOutputSchema,
  permission: "configuration:write",
  // Not an entity of its own: rows are audited per kind created; the no-op row as a type change.
  entityType: "entityType",
  handler: async ({ input, context }) => {
    const template = getConfigurationTemplate({ key: input.template });
    const lists = await importLists({ context, template });
    if (!lists.ok) return lists;
    const types = await importTypes({ context, template, listIds: lists.value.ids });
    if (!types.ok) return types;
    const responsibilities = await importResponsibilities({ context, template });
    if (!responsibilities.ok) return responsibilities;
    return ok({
      value: {
        created: {
          vocabularies: lists.value.created,
          entityTypes: types.value.created,
          responsibilities: responsibilities.value.created,
        },
        skipped: {
          vocabularies: lists.value.skipped,
          entityTypes: types.value.skipped,
          responsibilities: responsibilities.value.skipped,
        },
      },
    });
  },
});

export const configurationOperations = [importConfigurationTemplate];
