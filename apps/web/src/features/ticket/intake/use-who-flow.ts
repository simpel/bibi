import type { SimilarCustomer } from "@bibi/core";
import { useState, useTransition } from "react";
import { type CustomerOption, findSimilarCustomersAction } from "../../customer/actions";

/** Where step 1 is: searching, looking at likely duplicates, or filling in a new customer. */
export type WhoMode =
  | { kind: "search" }
  | { kind: "similar"; name: string; matches: SimilarCustomer[] }
  | { kind: "new"; name: string };

export type UseWhoFlowInput = { initial: CustomerOption | null };

/**
 * Step 1's customer half: the chosen customer, and the path to a new one, which first asks
 * `customer.findSimilar`. A failed check goes on to the form: the check only helps. A customer
 * `picked` here goes on with its default contact; one reopened by Change shows the picker.
 */
export function useWhoFlow({ initial }: UseWhoFlowInput) {
  const [customer, setCustomer] = useState<CustomerOption | null>(initial);
  const [mode, setMode] = useState<WhoMode>({ kind: "search" });
  /** Chosen here (search, recent, "looks like" or created), not reopened by Change. */
  const [picked, setPicked] = useState(false);
  const [checking, startCheck] = useTransition();
  const startNew = ({ name }: { name: string }) =>
    startCheck(async () => {
      const result = await findSimilarCustomersAction({ name }).catch(() => null);
      const matches = result?.ok ? result.value.items : [];
      setMode(matches.length > 0 ? { kind: "similar", name, matches } : { kind: "new", name });
    });
  const choose = ({ customer: next }: { customer: CustomerOption | null }) => {
    setCustomer(next);
    setPicked(next !== null);
    setMode({ kind: "search" });
  };
  return { customer, picked, mode, setMode, checking, startNew, choose };
}
