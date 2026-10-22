import { timingSafeEqual } from "node:crypto";
import { AppError, err, ok, type Result } from "@bibi/core";
import { hashInput } from "./canonical-json";
import { mac } from "./sign";
import { type ApprovalClaims, ApprovalClaimsSchema } from "./types";

export type VerifyApprovalInput = {
  token: string;
  secret: string;
  organizationId: string;
  userId: string;
  now?: number;
};

type DenyInput = { message: string };

const deny = ({ message }: DenyInput) =>
  err({ error: new AppError({ code: "FORBIDDEN", message }) });

type ParseInput = { body: string };

function parseClaims({ body }: ParseInput): ApprovalClaims | undefined {
  try {
    const parsed = ApprovalClaimsSchema.safeParse(
      JSON.parse(Buffer.from(body, "base64url").toString()),
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

/** Checks signature, expiry, input hash and that org and user match the confirming caller. */
export function verifyApprovalToken({
  token,
  secret,
  organizationId,
  userId,
  now = Math.floor(Date.now() / 1000),
}: VerifyApprovalInput): Result<ApprovalClaims> {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined)
    return deny({ message: "Invalid approval token" });
  const given = Buffer.from(signature, "base64url");
  const expected = mac({ body, secret });
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return deny({ message: "Invalid approval token" });
  }
  const claims = parseClaims({ body });
  if (!claims || hashInput({ value: claims.input }) !== claims.inputHash) {
    return deny({ message: "Invalid approval token" });
  }
  if (claims.exp <= now) return deny({ message: "Approval token expired; ask for a new proposal" });
  if (claims.organizationId !== organizationId || claims.userId !== userId) {
    return deny({ message: "Approval token belongs to another user or organization" });
  }
  return ok({ value: claims });
}
