import { z } from "zod";

/** Vercel AI Gateway `GET /v1/models` (only the fields Okazi uses; unknown types are skipped). */
export const GatewayCatalogSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      owned_by: z.string().optional(),
      type: z.string().optional(),
      description: z.string().nullish(),
      context_window: z.number().nullish(),
      tags: z.array(z.string()).nullish(),
      deprecated_at: z.union([z.string(), z.number()]).nullish(),
      pricing: z
        .object({ input: z.string().nullish(), output: z.string().nullish() })
        .partial()
        .nullish(),
    }),
  ),
});

export type GatewayCatalog = z.infer<typeof GatewayCatalogSchema>;
