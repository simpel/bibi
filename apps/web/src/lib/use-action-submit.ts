"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "./action-result";
import { type ErrorKey, errorKeyForCode } from "./error-key";

export type UseActionSubmitInput<T> = { onSuccess: (value: T) => void };

export type RunActionInput<T> = { action: () => Promise<ActionResult<T>> };

/** Pending/error state for one server action call; success is delegated to `onSuccess`. */
export function useActionSubmit<T>({ onSuccess }: UseActionSubmitInput<T>) {
  const [pending, startTransition] = useTransition();
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);

  const run = ({ action }: RunActionInput<T>): void => {
    setErrorKey(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onSuccess(result.value);
      else setErrorKey(errorKeyForCode({ code: result.error.code }));
    });
  };

  return { pending, errorKey, run, reset: () => setErrorKey(null) };
}
