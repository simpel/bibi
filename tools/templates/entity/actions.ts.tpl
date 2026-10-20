"use server";

import {
  archive{{Pascal}},
  create{{Pascal}},
  type {{Pascal}}CreateInput,
  type {{Pascal}}Dto,
  update{{Pascal}},
} from "@okazi/core";
import type { {{Pascal}}UpdateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

// Server actions for {{Pascal}}: forms that change data always go through these (apps/web/CLAUDE.md, Forms).
// Remember: export {{Pascal}}UpdateInputSchema from packages/core/src/schemas.ts and the types/operations from index.ts.
type {{Pascal}}UpdateInput = z.infer<typeof {{Pascal}}UpdateInputSchema>;

export type Create{{Pascal}}ActionInput = { input: {{Pascal}}CreateInput };
export type Update{{Pascal}}ActionInput = { input: {{Pascal}}UpdateInput };
export type Archive{{Pascal}}ActionInput = { id: string };

export async function create{{Pascal}}Action({
  input,
}: Create{{Pascal}}ActionInput): Promise<ActionResult<{{Pascal}}Dto>> {
  return toActionResult({ result: await runOperation({ operation: create{{Pascal}}, input }) });
}

export async function update{{Pascal}}Action({
  input,
}: Update{{Pascal}}ActionInput): Promise<ActionResult<{{Pascal}}Dto>> {
  return toActionResult({ result: await runOperation({ operation: update{{Pascal}}, input }) });
}

export async function archive{{Pascal}}Action({
  id,
}: Archive{{Pascal}}ActionInput): Promise<ActionResult<{{Pascal}}Dto>> {
  return toActionResult({
    result: await runOperation({ operation: archive{{Pascal}}, input: { id } }),
  });
}
