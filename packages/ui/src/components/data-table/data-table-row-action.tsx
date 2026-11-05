import { PlusIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

export type DataTableRowActionProps = {
  /** The accessible name and tooltip. Never shown as inline text in table buttons. */
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  /** Kept for backwards compatibility; row action buttons are now always icon-only with tooltips. */
  iconOnly?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * Checks if an action is a create / new action to default to the plus icon.
 */
function isCreateAction({ label }: { label: string }): boolean {
  return /\b(new|create|add|ny|skapa|lägg till)\b/i.test(label);
}

/**
 * One primary row action, drawn only by `DataTableRowActions`.
 * Always an icon-only button with a shadcn tooltip across all tables; labels are never displayed inline.
 */
export function DataTableRowAction({
  label,
  icon,
  onClick,
  destructive = false,
  disabled,
}: DataTableRowActionProps) {
  const Icon = icon ?? (isCreateAction({ label }) ? PlusIcon : PlusIcon);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn("size-8 shrink-0", destructive && "text-destructive")}
        >
          <Icon aria-hidden className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
