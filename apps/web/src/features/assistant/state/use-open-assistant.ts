"use client";

import { useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Navigates to the assistant page (ADR 0110). */
export function useOpenAssistant() {
  const router = useRouter();
  return useCallback(() => router.push(ROUTES.assistant), [router]);
}
