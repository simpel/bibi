import { setTimeout as sleep } from "node:timers/promises";
import { openSecret } from "../../../crypto/secret-box";
import { AppError } from "../../../errors/app-error";
import { err, ok, type Result } from "../../../errors/result";
import { nowOf } from "../../../time/now";
import { type FortnoxRowInput, fortnoxNotConnected, markFortnoxExpired } from "./connection-state";
import { getFortnoxGateway } from "./gateway-registry";
import { toTokenData } from "./token-data";

/** A claim older than this is abandoned (its holder died) and may be taken over. */
const LEASE_MS = 30_000;
const WAIT_STEP_MS = 250;
const WAIT_STEPS = 40;

/**
 * Spends the row's refresh token once (ADR 0087). Fortnox rotates it on every refresh and the old
 * one dies at once, so only the caller holding the 30-second lease calls Fortnox; any other caller
 * waits for the rotated row and uses its access token. Only a refusal of the stored token is EXPIRED.
 */
export async function refreshFortnoxConnection({
  context,
  row,
}: FortnoxRowInput): Promise<Result<string>> {
  if (!row.refreshTokenSealed) return fortnoxNotConnected();
  if (!(await claim({ context, row }))) return awaitRotation({ context, row });
  const spent = await spend({ context, row });
  // An outage leaves the old token valid: hand the lease back for the next caller.
  if (!spent.ok) await release({ context, row });
  return spent;
}

/** Takes the lease if the row still holds this refresh token and nobody holds a live lease. */
async function claim({ context, row }: FortnoxRowInput): Promise<boolean> {
  const now = nowOf({ context });
  const { count } = await context.db.integrationConnection.updateMany({
    where: {
      id: row.id,
      refreshTokenSealed: row.refreshTokenSealed,
      OR: [
        { refreshClaimedAt: null },
        { refreshClaimedAt: { lt: new Date(now.getTime() - LEASE_MS) } },
      ],
    },
    data: { refreshClaimedAt: now },
  });
  return count === 1;
}

async function spend({ context, row }: FortnoxRowInput): Promise<Result<string>> {
  const refreshToken = openSecret({ sealed: row.refreshTokenSealed ?? "" });
  if (!refreshToken.ok) return refreshToken;
  const refreshed = await getFortnoxGateway().refresh({ refreshToken: refreshToken.value });
  if (!refreshed.ok) return refreshed;
  if (refreshed.value.kind === "refused") return markFortnoxExpired({ context, row });
  const { tokens } = refreshed.value;
  const data = toTokenData({ tokens, now: nowOf({ context }) });
  if (!data.ok) return data;
  await context.db.integrationConnection.update({
    where: { id: row.id },
    data: { ...data.value, refreshClaimedAt: null },
  });
  return ok({ value: tokens.accessToken });
}

const release = ({ context, row }: FortnoxRowInput) =>
  context.db.integrationConnection.updateMany({
    where: { id: row.id, refreshTokenSealed: row.refreshTokenSealed },
    data: { refreshClaimedAt: null },
  });

/** Another caller holds the lease: wait for the rotated token, or take over a released lease. */
async function awaitRotation({ context, row }: FortnoxRowInput): Promise<Result<string>> {
  for (let step = 0; step < WAIT_STEPS; step++) {
    const current = await context.db.integrationConnection.findFirst({ where: { id: row.id } });
    if (current?.status !== "CONNECTED" || !current.accessTokenSealed) return fortnoxNotConnected();
    if (current.refreshTokenSealed !== row.refreshTokenSealed) {
      return openSecret({ sealed: current.accessTokenSealed });
    }
    if (!current.refreshClaimedAt) return refreshFortnoxConnection({ context, row: current });
    await sleep(WAIT_STEP_MS);
  }
  const message = "Fortnox is refreshing the connection; try again shortly.";
  return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
}
