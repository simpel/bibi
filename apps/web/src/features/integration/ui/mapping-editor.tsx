"use client";

import type {
  AccountMappingDto,
  IntegrationProvider,
  ProviderAccountDto,
} from "@bibi/core/schemas";
import { MappingCanvas, type MappingCanvasLabels } from "@bibi/ui";
import { useMemo, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setAccountMappingAction } from "../actions";
import {
  accountsOf,
  type PurposeDef,
  parsePurposeId,
  purposesOf,
  withMapping,
} from "../lib/mapping-model";

export type MappingEditorProps = {
  provider: IntegrationProvider;
  defs: PurposeDef[];
  mappings: AccountMappingDto[];
  chart: ProviderAccountDto[];
  /** The mapped references a problem was found for. */
  issueAccounts: (string | null)[];
  canEdit: boolean;
  /** Every text is written on the server in the user's language. */
  labels: MappingCanvasLabels;
  attentionText: string;
  messages: { pending: string; success: string };
};

/**
 * The mapping canvas with its own optimistic state (ADR 0123): a line shows at once, the save runs
 * as one toast, and an error puts the previous mappings back.
 */
export function MappingEditor(props: MappingEditorProps) {
  const { provider, defs, chart, issueAccounts, canEdit, labels, attentionText, messages } = props;
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [mappings, setMappings] = useState(props.mappings);
  const accounts = useMemo(
    () => accountsOf({ provider, chart, mappings }),
    [provider, chart, mappings],
  );
  const purposes = useMemo(
    () => purposesOf({ defs, mappings, chart, issueAccounts, attentionText }),
    [defs, mappings, chart, issueAccounts, attentionText],
  );
  const change = ({ purposeId, accountId }: { purposeId: string; accountId: string | null }) => {
    const previous = mappings;
    setMappings(withMapping({ mappings, purposeId, accountId }));
    run({
      action: () =>
        setAccountMappingAction({
          input: { ...parsePurposeId({ id: purposeId }), providerAccount: accountId },
        }),
      messages,
      onSuccess: () => router.refresh(),
      onError: () => setMappings(previous),
    });
  };
  return (
    <MappingCanvas
      purposes={purposes}
      accounts={accounts}
      labels={labels}
      disabled={!canEdit || pending}
      onConnect={change}
      onDisconnect={({ purposeId }) => change({ purposeId, accountId: null })}
    />
  );
}
