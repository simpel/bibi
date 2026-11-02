import type { ContactDto } from "@bibi/core";
import { useCallback, useEffect, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { listCustomerContactsAction } from "../../contact/actions";

export type CustomerContacts =
  | { status: "loading" }
  | { status: "error"; errorKey: ErrorKey }
  | { status: "ready"; contacts: ContactDto[] };

/** The chosen customer's active contacts (`contact.list`), loaded when the customer changes. */
export function useCustomerContacts({ customerId }: { customerId: string }) {
  const [state, setState] = useState<CustomerContacts>({ status: "loading" });
  useEffect(() => {
    let current = true;
    setState({ status: "loading" });
    listCustomerContactsAction({ customerId })
      .then((result) => {
        if (!current) return;
        if (result.ok) setState({ status: "ready", contacts: result.value });
        else setState({ status: "error", errorKey: errorKeyForCode(result.error) });
      })
      .catch(() => current && setState({ status: "error", errorKey: "network" }));
    return () => {
      current = false;
    };
  }, [customerId]);
  const added = useCallback(({ contact }: { contact: ContactDto }) => {
    setState((prev) => ({
      status: "ready",
      contacts: [...(prev.status === "ready" ? prev.contacts : []), contact],
    }));
  }, []);
  return { state, added };
}
