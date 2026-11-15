"use client";

import type { PermissionSet } from "@bibi/core";
import { CommandGroup, CommandItem } from "@bibi/ui";
import { ArrowRightIcon, ListFilterIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CommandHit } from "@/features/search/command-hits";
import { type CommandLookupInput, commandLookupAction } from "@/features/search/command-lookup";
import { canPermission } from "@/lib/can";
import { lastValue } from "@/lib/live-query-state";
import { useLiveQuery } from "@/lib/use-live-query";
import { type CommandQuery, commandListHref, SCOPE_PERMISSION } from "./command-query";

export type LookupCommandGroupProps = {
  query: CommandQuery;
  permissions: PermissionSet;
  onGo: (target: { href: string }) => void;
};

type Primary = { label: string; href: string; hit: boolean };

const lookupInput = ({ query }: { query: CommandQuery }): { query: CommandLookupInput } | null =>
  query.kind === "orders" ? null : { query };

const listOf = ({ query }: { query: CommandQuery }) => {
  if (query.kind === "orders") return { scope: "order" as const, q: query.q };
  if (query.kind === "reference") return { scope: "order" as const, q: `#${query.reference}` };
  return { scope: query.scope, q: query.text };
};

/**
 * Results of a prefix search (`#34`, `customer:acme`, `status:Lead`). The first item is what Enter
 * does: open the one match, else the list page searched for the text. The items bypass cmdk's
 * own filter (`forceMount`), since the text holds the prefix.
 */
export function LookupCommandGroup({ query, permissions, onGo }: LookupCommandGroupProps) {
  const t = useTranslations("commandBar.lookup");
  const list = listOf({ query });
  const allowed = canPermission({ permissions, permission: SCOPE_PERMISSION[list.scope] });
  const input = allowed ? lookupInput({ query }) : null;
  const state = useLiveQuery({ input, load: commandLookupAction, waitMs: 150 });
  if (!allowed) return null;
  const found = state.status === "ready" ? state.value : null;
  const shown = lastValue({ state })?.hits ?? [];
  const single = found && found.hits.length === 1 && !found.more ? found.hits[0] : undefined;
  const primary: Primary = single
    ? { label: t("open", { name: single.title }), href: single.href, hit: true }
    : { label: t(list.scope, { query: list.q }), href: commandListHref(list), hit: false };
  const rows = single ? [] : shown;
  return (
    <CommandGroup forceMount heading={t("heading")}>
      <CommandItem forceMount value="lookup:primary" onSelect={() => onGo({ href: primary.href })}>
        {primary.hit ? <ArrowRightIcon /> : <ListFilterIcon />}
        <span className="truncate">{primary.label}</span>
      </CommandItem>
      {rows.map((hit) => (
        <HitItem key={hit.id} hit={hit} onGo={onGo} />
      ))}
    </CommandGroup>
  );
}

function HitItem({ hit, onGo }: { hit: CommandHit; onGo: (target: { href: string }) => void }) {
  return (
    <CommandItem forceMount value={`lookup:${hit.id}`} onSelect={() => onGo({ href: hit.href })}>
      <ArrowRightIcon />
      <span className="truncate">{hit.title}</span>
      {hit.detail ? (
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{hit.detail}</span>
      ) : null}
    </CommandItem>
  );
}
