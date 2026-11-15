"use client";

import type { PermissionSet } from "@bibi/core";
import { CommandGroup, CommandItem } from "@bibi/ui";
import { HashIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { canPermission } from "@/lib/can";
import { type CommandScope, SCOPE_PERMISSION, SCOPE_PREFIXES } from "./command-query";

export type PrefixHintGroupProps = {
  permissions: PermissionSet;
  onPrefix: (prefix: string) => void;
};

const SCOPES: readonly CommandScope[] = ["order", "customer", "venue", "item"];

/**
 * "Search in": the prefixes the bar understands (`#`, `customer:`). Picking one puts it in the
 * input; cmdk matches the typed text against every prefix word, so `kund` finds `customer:`.
 */
export function PrefixHintGroup({ permissions, onPrefix }: PrefixHintGroupProps) {
  const t = useTranslations("commandBar.prefixes");
  const scopes = SCOPES.filter((scope) =>
    canPermission({ permissions, permission: SCOPE_PERMISSION[scope] }),
  );
  if (scopes.length === 0) return null;
  const orders = scopes.includes("order");
  return (
    <CommandGroup heading={t("heading")}>
      {orders ? (
        <CommandItem value={`# ${t("reference")}`} onSelect={() => onPrefix("#")}>
          <HashIcon />
          <span className="font-mono text-xs">#</span>
          <span className="text-muted-foreground">{t("reference")}</span>
        </CommandItem>
      ) : null}
      {scopes.map((scope) => {
        const [word] = SCOPE_PREFIXES[scope];
        return (
          <CommandItem
            key={scope}
            value={`${SCOPE_PREFIXES[scope].join(": ")}: ${t(scope)}`}
            onSelect={() => onPrefix(`${word}:`)}
          >
            <SearchIcon />
            <span className="font-mono text-xs">{word}:</span>
            <span className="text-muted-foreground">{t(scope)}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
