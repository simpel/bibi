import { usePathname } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

/** True on `/`, where the assistant is the page itself and the dock stays hidden (ADR 0035). */
export function useOnHome(): boolean {
  return usePathname() === ROUTES.home;
}
