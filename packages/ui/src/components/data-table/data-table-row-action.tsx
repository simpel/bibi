import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

export type DataTableRowActionProps = {
  /** The visible text on wide tables, and always the accessible name and tooltip. */
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  /** The icon alone at every width, for actions whose icon is unmistakable (download, copy). */
  iconOnly?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * One direct row action in the actions column. A narrow table shows the icon, a wide one icon and
 * label, unless `iconOnly`. The label is always the accessible name and the tooltip.
 */
export function DataTableRowAction({
  label,
  icon: Icon,
  onClick,
  iconOnly = false,
  destructive = false,
  disabled,
}: DataTableRowActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn("px-2", !iconOnly && "@2xl:px-3", destructive && "text-destructive")}
        >
          <Icon aria-hidden />
          {iconOnly ? null : <span className="hidden @2xl:inline">{label}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Lays out the actions of one row side by side, right-aligned. */
export function DataTableRowActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}
