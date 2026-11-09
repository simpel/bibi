import { fortnoxCredentials } from "../fortnox-config";

/** Fortnox keeps Topics events this long; a longer gap needs a sweep (ADR 0090). */
export const FORTNOX_REPLAY_MS = 14 * 24 * 60 * 60 * 1000;

/** The app's client secret `add-tenants-v1` needs, or null while Fortnox is not configured. */
export const fortnoxStreamSecret = (): string | null => fortnoxCredentials()?.clientSecret ?? null;
