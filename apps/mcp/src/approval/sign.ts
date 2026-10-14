import { createHmac, randomUUID } from "node:crypto";
import { hashInput } from "./canonical-json";
import { APPROVAL_TTL_SECONDS, type ApprovalClaims } from "./types";

const DOMAIN = "okazi.mcp.approval.v1";

export type MacInput = { body: string; secret: string };

export function mac({ body, secret }: MacInput): Buffer {
  return createHmac("sha256", secret).update(`${DOMAIN}.${body}`).digest();
}

export type SignApprovalInput = {
  operation: string;
  /** Validated input of the proposal; hashed and embedded in the token. */
  input: unknown;
  organizationId: string;
  userId: string;
  conversationId?: string | undefined;
  secret: string;
  /** Unix seconds; injectable for tests. */
  now?: number;
  ttlSeconds?: number;
};

export type SignedApproval = { token: string; claims: ApprovalClaims };

/** `base64url(claims).base64url(hmac)`; stateless, bound to operation, input, org and user. */
export function signApprovalToken({
  secret,
  now = Math.floor(Date.now() / 1000),
  ttlSeconds = APPROVAL_TTL_SECONDS,
  ...rest
}: SignApprovalInput): SignedApproval {
  const claims: ApprovalClaims = {
    v: 1,
    jti: randomUUID(),
    operation: rest.operation,
    input: rest.input,
    inputHash: hashInput({ value: rest.input }),
    organizationId: rest.organizationId,
    userId: rest.userId,
    ...(rest.conversationId ? { conversationId: rest.conversationId } : {}),
    exp: now + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { token: `${body}.${mac({ body, secret }).toString("base64url")}`, claims };
}
