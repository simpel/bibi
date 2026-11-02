import { toast } from "@bibi/ui";
import { useEffect } from "react";

export type UsePendingToastInput = { pending: boolean; message: string };

/**
 * A loading toast while `pending` (a navigation such as a search, which has no outcome to report):
 * shown when it starts and dismissed when the next page is there.
 */
export function usePendingToast({ pending, message }: UsePendingToastInput) {
  useEffect(() => {
    if (!pending) return;
    const id = toast.loading(message);
    return () => {
      toast.dismiss(id);
    };
  }, [pending, message]);
}
