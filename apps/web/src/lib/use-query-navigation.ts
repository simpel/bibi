import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/lib/navigation";
import { patchQuery } from "./patch-query";

/**
 * Patches the page's URL state (paging, sorting, search) and lets the server render the result;
 * `pending` while it does, so the current rows stay visible, dimmed.
 */
export function useQueryNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  /** `pageKey`: the page key that any other change resets (a scoped table has its own). */
  const navigate = ({
    patch,
    pageKey,
  }: {
    patch: Record<string, string | null>;
    pageKey?: string;
  }) => {
    const query = patchQuery({
      current: new URLSearchParams(searchParams),
      patch,
      ...(pageKey ? { pageKey } : {}),
    });
    startTransition(() => router.push(`${pathname}${query}`, { scroll: false }));
  };
  return { navigate, pending };
}
