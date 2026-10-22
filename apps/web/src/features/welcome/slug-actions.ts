"use server";

import { checkOrganizationSlug, type SlugCheck } from "@bibi/auth";
import { z } from "zod";
import { getSessionState } from "@/server/session";

const SlugInputSchema = z.object({ slug: z.string().max(80) });

/** Live check for `/welcome/new` (ADR 0062). Needs a session; reveals only taken or not. */
export async function checkSlugAction(input: { slug: string }): Promise<SlugCheck | null> {
  const parsed = SlugInputSchema.safeParse(input);
  if (!parsed.success) return null;
  const state = await getSessionState();
  if (state.status === "anonymous") return null;
  return checkOrganizationSlug({ slug: parsed.data.slug });
}
