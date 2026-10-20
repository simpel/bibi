import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../card/card";
import { PermissionChipList } from "./permission-chip-list";

export type PermissionFeatureRow = {
  /** Translated feature name, e.g. "Tickets". */
  label: string;
  /** Translated actions, e.g. "View, Edit". */
  actions: string;
};

export type PermissionProfileCardProps = {
  /** Localised card title, e.g. "Preset". */
  presetTitle: string;
  /** Translated preset name; the preset is `null` for a subject with no valid role. */
  preset: string;
  allowedTitle: string;
  /** Overrides that add to the preset, e.g. "Items: Edit". */
  allowed: readonly string[];
  deniedTitle: string;
  /** Overrides that take away from the preset. */
  denied: readonly string[];
  /** Shown when there are no overrides. */
  noOverrides: string;
  effectiveTitle: string;
  /** Features the subject can see, with their actions. */
  features: readonly PermissionFeatureRow[];
  hiddenTitle: string;
  /** Translated names of features the subject cannot see at all. */
  hidden: readonly string[];
  /** Link to the full permissions page. */
  footer?: ReactNode;
  className?: string;
};

/** Read-only summary of a member's or API key's permissions (preset, overrides, effective). */
export function PermissionProfileCard(props: PermissionProfileCardProps) {
  const { allowed, denied, features, hidden, className } = props;
  return (
    <Card data-slot="permission-profile-card" className={cn("shadow-none", className)}>
      <CardHeader className="gap-1 p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {props.presetTitle}
          <Badge variant="secondary">{props.preset}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0">
        <PermissionChipList title={props.allowedTitle} chips={allowed} tone="allow" />
        <PermissionChipList title={props.deniedTitle} chips={denied} tone="deny" />
        {allowed.length + denied.length === 0 ? (
          <p className="text-sm text-muted-foreground">{props.noOverrides}</p>
        ) : null}
        <PermissionChipList
          title={props.effectiveTitle}
          chips={features.map(({ label, actions }) => `${label}: ${actions}`)}
        />
        <PermissionChipList title={props.hiddenTitle} chips={hidden} />
      </CardContent>
      {props.footer ? <CardFooter className="p-4 pt-0 text-sm">{props.footer}</CardFooter> : null}
    </Card>
  );
}
