import { sealSecret } from "../../../crypto/secret-box";
import { ok, type Result } from "../../../errors/result";
import { FORTNOX_REFRESH_TTL_MS } from "./fortnox-config";
import type { FortnoxTokens } from "./gateway";

export type TokenData = {
  accessTokenSealed: string;
  refreshTokenSealed: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  scope: string;
};

export type ToTokenDataInput = { tokens: FortnoxTokens; now: Date };

/** The columns a fresh token pair writes, sealed (ADR 0087). */
export function toTokenData({ tokens, now }: ToTokenDataInput): Result<TokenData> {
  const access = sealSecret({ plain: tokens.accessToken });
  if (!access.ok) return access;
  const refresh = sealSecret({ plain: tokens.refreshToken });
  if (!refresh.ok) return refresh;
  return ok({
    value: {
      accessTokenSealed: access.value,
      refreshTokenSealed: refresh.value,
      accessExpiresAt: new Date(now.getTime() + tokens.expiresIn * 1000),
      refreshExpiresAt: new Date(now.getTime() + FORTNOX_REFRESH_TTL_MS),
      scope: tokens.scope,
    },
  });
}
