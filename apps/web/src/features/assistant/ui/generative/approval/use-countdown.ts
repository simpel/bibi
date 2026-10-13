"use client";

import { useEffect, useState } from "react";
import { secondsLeft } from "../../../lib/format-countdown";

export type UseCountdownInput = { expiresAt: string; active: boolean };

/** Whole seconds until `expiresAt`, ticking once a second while `active`. */
export function useCountdown({ expiresAt, active }: UseCountdownInput): number {
  const [seconds, setSeconds] = useState(() => secondsLeft({ expiresAt, now: Date.now() }));
  useEffect(() => {
    setSeconds(secondsLeft({ expiresAt, now: Date.now() }));
    if (!active) return;
    const timer = setInterval(() => {
      setSeconds(secondsLeft({ expiresAt, now: Date.now() }));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, active]);
  return seconds;
}
