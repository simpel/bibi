import { type ErrorKey, errorKeyForCode, parseAppErrorCode } from "@/lib/error-key";

export type AssistantErrorKeyInput = { error: Error };

type ReadCodeInput = { message: string };

function readCode({ message }: ReadCodeInput) {
  try {
    const parsed: unknown = JSON.parse(message);
    const code = (parsed as { error?: { code?: unknown } } | null)?.error?.code;
    return parseAppErrorCode({ value: code });
  } catch {
    return null;
  }
}

/**
 * `useChat` errors → `errors.*` key. Before the stream starts the chat route answers JSON
 * `{ error: { code } }` (the transport turns the body into the message); fetch failures are
 * network errors; anything else (including the safe in-stream message) is generic.
 */
export function assistantErrorKey({ error }: AssistantErrorKeyInput): ErrorKey {
  const code = readCode({ message: error.message });
  if (code) return errorKeyForCode({ code });
  if (error instanceof TypeError || /failed to fetch|network|load failed/i.test(error.message)) {
    return "network";
  }
  return "generic";
}
