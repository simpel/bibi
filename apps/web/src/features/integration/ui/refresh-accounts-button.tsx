"use client";

import type { IntegrationProvider } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { syncIntegrationAccountsAction } from "../actions";

export type RefreshAccountsButtonProps = {
  provider: IntegrationProvider;
  /** Every text is written on the server in the user's language. */
  label: string;
  messages: { pending: string; success: string };
};

/** Reads the accounting system's accounts again (ADR 0123). */
export function RefreshAccountsButton({ provider, label, messages }: RefreshAccountsButtonProps) {
  const router = useRouter();
  const { run, pending } = useToastAction();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        run({
          action: () => syncIntegrationAccountsAction({ provider }),
          messages,
          onSuccess: () => router.refresh(),
        })
      }
    >
      {label}
    </Button>
  );
}
