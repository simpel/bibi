import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type BookingStatusMenuChoice = "edit" | "transitions" | "archive";

export type BookingStatusMenuProps = {
  onChoose: (input: { choice: BookingStatusMenuChoice }) => void;
};

/** The ⋯ menu of one status row. */
export function BookingStatusMenu({ onChoose }: BookingStatusMenuProps) {
  const t = useTranslations("bookingStatus");
  const common = useTranslations("common");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={common("actions")}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onChoose({ choice: "edit" })}>
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onChoose({ choice: "transitions" })}>
          {t("editTransitions")}
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => onChoose({ choice: "archive" })}>
          {t("archive")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
