import type { ComponentProps } from "react";
import { Badge } from "../../components/badge/badge";
import { Switch } from "../../components/switch/switch";

export type SettingsRuleRowProps = {
  title: string;
  description: string;
  badgeVariant?: ComponentProps<typeof Badge>["variant"];
  badgeLabel?: string;
};

export function SettingsRuleRow({
  title,
  description,
  badgeVariant,
  badgeLabel,
}: SettingsRuleRowProps) {
  const titleNode = <span className="text-sm font-medium text-foreground">{title}</span>;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="space-y-1 pr-4">
        {badgeLabel ? (
          <div className="flex items-center gap-2">
            {titleNode}
            <Badge variant={badgeVariant} className="text-[10px]">
              {badgeLabel}
            </Badge>
          </div>
        ) : (
          titleNode
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked />
    </div>
  );
}
