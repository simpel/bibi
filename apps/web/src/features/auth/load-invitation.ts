import "server-only";
import { getAuth } from "@bibi/auth";
import { headers } from "next/headers";
import { z } from "zod";
import type { InvitationView } from "./invitation-type";

const InvitationSchema = z.object({
  organizationName: z.string(),
  inviterEmail: z.string(),
  role: z.string(),
});

/** The invitation for the signed-in invitee (Better Auth `getInvitation`). */
export async function loadInvitation({
  invitationId,
}: {
  invitationId: string;
}): Promise<InvitationView> {
  const data = await getAuth()
    .api.getInvitation({ query: { id: invitationId }, headers: await headers() })
    .catch(() => null);
  const parsed = InvitationSchema.safeParse(data);
  return parsed.success ? { status: "ready", ...parsed.data } : { status: "invalid" };
}
