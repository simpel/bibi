"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export type UserInvitation = {
  id: string;
  organizationName: string;
  role: string;
};

/** Pending invitations for the signed-in email (Better Auth `listUserInvitations`). */
export function useUserInvitations(): { invitations: UserInvitation[] | null } {
  const [invitations, setInvitations] = useState<UserInvitation[] | null>(null);
  useEffect(() => {
    let live = true;
    authClient.organization
      .listUserInvitations()
      .then(({ data }) => {
        if (live) setInvitations(data ?? []);
      })
      .catch(() => {
        if (live) setInvitations([]);
      });
    return () => {
      live = false;
    };
  }, []);
  return { invitations };
}
