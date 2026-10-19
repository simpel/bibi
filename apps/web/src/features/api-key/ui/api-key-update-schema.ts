import { ApiKeyUpdateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the update page: the key's name and preset. */
export type ApiKeyUpdateValues = { name: string; role: string };

export type ApiKeyUpdateSchemaInput = { id: string };

/** Core's `apiKey.update` schema validates the form (CLAUDE.md "Forms"). */
export function apiKeyUpdateSchema({ id }: ApiKeyUpdateSchemaInput) {
  return formSchema({
    schema: ApiKeyUpdateInputSchema,
    toInput: ({ values }: { values: ApiKeyUpdateValues }) => ({ id, ...values }),
  });
}
