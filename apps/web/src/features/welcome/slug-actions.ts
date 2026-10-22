"use server";

import { checkOrganizationSlug, type SlugCheck } from "@bibi/auth";
import { z } from "zod";
import { getSessionState } from "@/server/session";

const SlugInputSchema = z.object({ slug: z.string().max(80) });

export type CheckSlugActionInput = { slug: string };

/** Live check for `/welcome/new` (ADR 0062). Needs a session; reveals only taken or not. */
export async function checkSlugAction({ slug }: CheckSlugActionInput): Promise<SlugCheck | null> {
  const parsed = SlugInputSchema.safeParse({ slug });
  if (!parsed.success) return null;
  const state = await getSessionState();
  if (state.status === "anonymous") return null;
  return checkOrganizationSlug({ slug: parsed.data.slug });
}
