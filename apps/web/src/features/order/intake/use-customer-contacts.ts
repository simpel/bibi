import type { ContactDto } from "@bibi/core";
import { useCallback, useState } from "react";
import type { ErrorKey } from "@/lib/error-key";
import { useLiveQuery } from "@/lib/use-live-query";
import { listCustomerContactsAction } from "../../contact/actions";

export type CustomerContacts =
  | { status: "loading" }
  | { status: "error"; errorKey: ErrorKey }
  | { status: "ready"; contacts: ContactDto[] };

type Added = { customerId: string; contacts: ContactDto[] };

/**
 * The chosen customer's active contacts (`contact.list`), loaded when the customer changes. A
 * contact added here shows at once, after the loaded ones.
 */
export function useCustomerContacts({ customerId }: { customerId: string }) {
  const live = useLiveQuery({ input: { customerId }, load: listCustomerContactsAction });
  const [added, setAdded] = useState<Added>({ customerId, contacts: [] });
  const add = useCallback(
    ({ contact }: { contact: ContactDto }) =>
      setAdded((before) => ({
        customerId,
        contacts: [...(before.customerId === customerId ? before.contacts : []), contact],
      })),
    [customerId],
  );
  if (live.status === "error") return { state: live, added: add };
  if (live.status !== "ready") return { state: { status: "loading" } as const, added: add };
  const loaded = new Set(live.value.map(({ id }) => id));
  const extra = added.customerId === customerId ? added.contacts : [];
  const contacts = [...live.value, ...extra.filter(({ id }) => !loaded.has(id))];
  return { state: { status: "ready", contacts } as CustomerContacts, added: add };
}
