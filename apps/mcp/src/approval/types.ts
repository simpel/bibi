import { z } from "zod";

export const APPROVAL_TTL_SECONDS = 10 * 60;

/** Signed payload of an approval token. `input` is the validated proposal; `inputHash` binds it. */
export const ApprovalClaimsSchema = z.object({
  v: z.literal(1),
  jti: z.string().min(1),
  operation: z.string().min(1),
  input: z.unknown(),
  inputHash: z.string().length(64),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  conversationId: z.string().optional(),
  exp: z.number().int(),
});

export type ApprovalClaims = z.infer<typeof ApprovalClaimsSchema>;

/** Result returned to the caller instead of executing an AI-proposed command. */
export type ApprovalRequired = {
  status: "approval_required";
  operation: string;
  input: unknown;
  summary: string;
  approvalToken: string;
  expiresAt: string;
};
