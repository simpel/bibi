import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/lib/navigation";
import { isPastePath } from "./intake-path";

/**
 * The paste dialog is open on `/new/ticket/message` (the sidebar's "From a message", an inbox
 * message's New ticket), and only while drafting has a model (ADR 0084). Closing it leaves the
 * path to `useStepUrl`, which replaces it with the open step's.
 */
export function usePasteDialog({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => enabled && isPastePath({ pathname }));
  const seen = useRef(pathname);
  // Browser URL: navigating to the paste path opens the dialog.
  useEffect(() => {
    if (pathname === seen.current) return;
    seen.current = pathname;
    if (enabled && isPastePath({ pathname })) setOpen(true);
  }, [enabled, pathname]);
  return { open, close: () => setOpen(false) };
}
