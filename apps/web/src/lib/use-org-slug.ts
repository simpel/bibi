"use client";

import { useParams } from "next/navigation";

/** The organization slug of the current URL (`/:locale/:org/...`), or `undefined` outside it. */
export function useOrgSlug(): string | undefined {
  const params = useParams<{ org?: string | string[] }>();
  return typeof params?.org === "string" ? params.org : undefined;
}
