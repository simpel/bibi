"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const InvitationSchema = z.object({
  organizationName: z.string(),
  inviterEmail: z.string(),
  role: z.string(),
});

export type InvitationState =
  | { status: "loading" }
  | { status: "invalid" }
  | ({ status: "ready" } & z.infer<typeof InvitationSchema>);

export type UseInvitationInput = { invitationId: string };

/** Loads an invitation for the signed-in invitee; anything unexpected counts as invalid. */
export function useInvitation({ invitationId }: UseInvitationInput): InvitationState {
  const [state, setState] = useState<InvitationState>({ status: "loading" });
  useEffect(() => {
    authClient.organization.getInvitation({ query: { id: invitationId } }).then(({ data }) => {
      const parsed = InvitationSchema.safeParse(data);
      setState(parsed.success ? { status: "ready", ...parsed.data } : { status: "invalid" });
    });
  }, [invitationId]);
  return state;
}
