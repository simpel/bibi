import { ApiKeyCreateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";

export const API_KEY_EXPIRY_CHOICES = ["never", "30", "90", "365"] as const;
export type ApiKeyExpiryChoice = (typeof API_KEY_EXPIRY_CHOICES)[number];

/** Raw values of the create dialog; the expiry is a choice of days. */
export type ApiKeyFormValues = { name: string; role: string; expires: ApiKeyExpiryChoice };

/** Core's `apiKey.create` schema validates the form (CLAUDE.md "Forms"). */
export const apiKeyFormSchema = formSchema({
  schema: ApiKeyCreateInputSchema,
  toInput: ({ values }: { values: ApiKeyFormValues }) => ({
    name: values.name,
    role: values.role,
    ...(values.expires === "never" ? {} : { expiresInDays: Number(values.expires) }),
  }),
});

export const apiKeyFormDefaults: ApiKeyFormValues = { name: "", role: "", expires: "90" };
