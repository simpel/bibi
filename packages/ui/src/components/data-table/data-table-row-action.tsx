import type { ComponentType, SVGProps } from "react";
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
 * One primary row action, drawn only by `DataTableRowActions`. A narrow table shows the icon, a
 * wide one icon and label, unless `iconOnly`. The label is always the accessible name and tooltip.
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
