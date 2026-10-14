import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "../button/button";
import type { DataTableLabels } from "./data-table-types";

export type DataTableNavProps = {
  pageIndex: number;
  pageCount: number;
  labels: DataTableLabels;
  onGoTo: (pageIndex: number) => void;
};

export function DataTableNav({ pageIndex, pageCount, labels, onGoTo }: DataTableNavProps) {
  const lastIndex = Math.max(pageCount - 1, 0);
  const atStart = pageIndex <= 0;
  const atEnd = pageIndex >= lastIndex;
  const buttons = [
    { label: labels.first, Icon: ChevronsLeftIcon, disabled: atStart, target: 0 },
    { label: labels.previous, Icon: ChevronLeftIcon, disabled: atStart, target: pageIndex - 1 },
    { label: labels.next, Icon: ChevronRightIcon, disabled: atEnd, target: pageIndex + 1 },
    { label: labels.last, Icon: ChevronsRightIcon, disabled: atEnd, target: lastIndex },
  ];
  return (
    <div className="flex items-center gap-1">
      {buttons.map(({ label, Icon, disabled, target }) => (
        <Button
          key={label}
          variant="outline"
          size="icon"
          aria-label={label}
          disabled={disabled}
          onClick={() => onGoTo(target)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
