"use client";

import { useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { welcomePath } from "../../lib/welcome-step";
import { useSetupDraft } from "./setup-draft-provider";

/** A later setup step without a chosen kind (e.g. opened directly) goes back to `kind`. */
export function useDraftGuard() {
  const router = useRouter();
  const context = useSetupDraft();
  const { org, draft, ready } = context;
  useEffect(() => {
    if (ready && draft.kind === null) router.replace(welcomePath({ step: "setup/kind" }), { org });
  }, [ready, draft.kind, org, router]);
  return context;
}
