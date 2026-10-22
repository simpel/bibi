import { usePathname, useRouter } from "@bibi/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { type LogHrefInput, logQueryString } from "./log-params";

/** Updates the log view's URL state; `pending` while the server renders the new page. */
export function useLogNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const navigate = ({ patch }: Pick<LogHrefInput, "patch">) => {
    const query = logQueryString({ current: new URLSearchParams(searchParams), patch });
    startTransition(() => router.push(`${pathname}${query}`, { scroll: false }));
  };
  return { navigate, pending, searchParams };
}
