import { isWorthKeeping, parseDraft, serializeDraft } from "./intake-draft";
import type { IntakeState } from "./intake-state";

/**
 * The browser's storage for the draft. Every access is guarded: storage can be missing or throw
 * (private windows, blocked site data), and the page works the same without it.
 */
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readDraft({ key }: { key: string }): IntakeState | null {
  try {
    return parseDraft({ text: storage()?.getItem(key) ?? null });
  } catch {
    return null;
  }
}

export type WriteDraftInput = { key: string; state: IntakeState };

/** Keeps the draft while it is worth offering, otherwise removes it. */
export function writeDraft({ key, state }: WriteDraftInput): void {
  try {
    if (isWorthKeeping({ state })) storage()?.setItem(key, serializeDraft({ state }));
    else storage()?.removeItem(key);
  } catch {
    // Storage is a convenience: a full or blocked store only means no draft next time.
  }
}

export function clearDraft({ key }: { key: string }): void {
  try {
    storage()?.removeItem(key);
  } catch {
    // See writeDraft.
  }
}
