import type { AnyOperation, Result } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import type { ApprovalRequired } from "./types";

export type LogProposalInput = { operation: AnyOperation; proposal: Result<ApprovalRequired> };

/** An AI-proposed command never reaches `execute` until approved, so it is logged here. */
export function logProposal({ operation, proposal }: LogProposalInput): void {
  if (proposal.ok) {
    const { expiresAt } = proposal.value;
    getLogger().info({ event: "approval.proposed", operation: operation.name, expiresAt });
    return;
  }
  getLogger().warn({
    event: "approval.proposalRejected",
    operation: operation.name,
    errorCode: proposal.error.code,
    errorMessage: proposal.error.message,
  });
}
