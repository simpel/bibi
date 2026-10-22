import type { ComponentProps, ReactNode } from "react";
import { Badge } from "../../components/badge/badge";
import { Card } from "../../components/card/card";

export type DashboardMetricCardProps = {
  label: string;
  badgeVariant: ComponentProps<typeof Badge>["variant"];
  badgeLabel: string;
  hero: ReactNode;
  footerClassName?: string;
  footer: ReactNode;
};

export function DashboardMetricCard({
  label,
  badgeVariant,
  badgeLabel,
  hero,
  footerClassName = "text-muted-foreground",
  footer,
}: DashboardMetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        <Badge variant={badgeVariant} className="text-[10px]">
          {badgeLabel}
        </Badge>
      </div>
      <div className="mt-3">{hero}</div>
      <div className={`mt-2 flex items-center gap-1.5 text-xs ${footerClassName}`}>{footer}</div>
    </Card>
  );
}
