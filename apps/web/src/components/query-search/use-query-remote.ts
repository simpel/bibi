import { useMemo } from "react";
import { searchCustomersAction } from "@/features/customer/actions";
import { searchMembersAction } from "@/features/member/actions";
import { useServerSearch } from "@/lib/use-server-search";
import type { QueryRemote } from "./lib/query-suggestion-types";
import { remoteOf } from "./lib/query-suggestions";
import { tokenAt } from "./lib/query-token";
import type { QueryVocabulary } from "./lib/query-vocabulary";

export type UseQueryRemoteInput = {
  text: string;
  caret: number;
  vocabulary: QueryVocabulary;
  /** Only while the dropdown is open. */
  open: boolean;
};

/**
 * Members after `assignee:`/`follower:` and customers after `customer:`, searched on the server
 * for what is typed (the first ones right after the colon), so every member and customer can be
 * found, not only a loaded page.
 */
export function useQueryRemote({ text, caret, vocabulary, open }: UseQueryRemoteInput) {
  const token = useMemo(() => tokenAt({ text, caret, vocabulary }), [text, caret, vocabulary]);
  const source = open ? remoteOf({ key: token.key }) : null;
  const query = token.partial;
  const members = useServerSearch({
    query,
    search: searchMembersAction,
    enabled: source === "members",
    allowEmpty: true,
  });
  const customers = useServerSearch({
    query,
    search: searchCustomersAction,
    enabled: source === "customers",
    allowEmpty: true,
  });
  return useMemo<QueryRemote>(
    () => ({ members: members.results, customers: customers.results }),
    [members.results, customers.results],
  );
}
