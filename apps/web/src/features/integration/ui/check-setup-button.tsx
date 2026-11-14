"use client";

import type { IntegrationProvider } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { checkIntegrationSetupAction } from "../actions";

export type CheckSetupButtonProps = {
  provider: IntegrationProvider;
  /** Every text is written on the server in the user's language. */
  label: string;
  messages: { pending: string; success: string };
};

/** Reads the accounting system's accounts again and shows what is missing (ADR 0108). */
export function CheckSetupButton({ provider, label, messages }: CheckSetupButtonProps) {
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
          action: () => checkIntegrationSetupAction({ provider }),
          messages,
          onSuccess: () => router.refresh(),
        })
      }
    >
      {label}
    </Button>
  );
}
