import type { SimilarCustomer } from "@bibi/core";
import { useState, useTransition } from "react";
import { type CustomerOption, findSimilarCustomersAction } from "../../customer/actions";

/**
 * Where step 1 is: searching, looking at likely duplicates, or filling in a new customer. The
 * form knows which name was already checked for duplicates (`checked`), so it checks again only
 * for a name typed there.
 */
export type WhoMode =
  | { kind: "search" }
  | { kind: "similar"; name: string; matches: SimilarCustomer[] }
  | { kind: "new"; name: string; checked: string | null };

export type UseWhoFlowInput = { initial: CustomerOption | null };

/**
 * Step 1's customer half: the chosen customer, and the path to a new one, which first asks
 * `customer.findSimilar`. A failed check goes on to the form: the check only helps. A customer
 * `picked` here goes on with its default contact; one it starts with (reopened by Change, or
 * preselected from a read message) shows its contact with Next.
 */
export function useWhoFlow({ initial }: UseWhoFlowInput) {
  const [customer, setCustomer] = useState<CustomerOption | null>(initial);
  const [mode, setMode] = useState<WhoMode>({ kind: "search" });
  /** Chosen here (search, recent, "looks like" or created), not one it started with. */
  const [picked, setPicked] = useState(false);
  const [checking, startCheck] = useTransition();
  const startNew = ({ name }: { name: string }) =>
    startCheck(async () => {
      const result = await findSimilarCustomersAction({ name }).catch(() => null);
      const matches = result?.ok ? result.value.items : [];
      const next: WhoMode = { kind: "new", name, checked: name };
      setMode(matches.length > 0 ? { kind: "similar", name, matches } : next);
    });
  const choose = ({ customer: next }: { customer: CustomerOption | null }) => {
    setCustomer(next);
    setPicked(next !== null);
    setMode({ kind: "search" });
  };
  /** The title row's New customer: an empty form, checked for duplicates on create. */
  const newCustomer = () => {
    setCustomer(null);
    setPicked(false);
    setMode({ kind: "new", name: "", checked: null });
  };
  return { customer, picked, mode, setMode, checking, startNew, choose, newCustomer };
}

export type WhoFlow = ReturnType<typeof useWhoFlow>;
