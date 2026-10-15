"use client";

import type { BookingStatusDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderBookingStatusesAction } from "../actions";

export type MoveStatusButtonsProps = { statuses: readonly BookingStatusDto[]; index: number };

type TargetInput = { to: number };

type SwapInput = { ids: string[]; from: number; to: number };

const swap = ({ ids, from, to }: SwapInput) => {
  const next = [...ids];
  const [moving, other] = [next[from], next[to]];
  if (moving === undefined || other === undefined) return next;
  next[from] = other;
  next[to] = moving;
  return next;
};

/** Moves a status one step within its phase (phases keep their lifecycle order). */
export function MoveStatusButtons({ statuses, index }: MoveStatusButtonsProps) {
  const t = useTranslations("bookingStatus");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const phase = statuses[index]?.phase;
  const canMove = ({ to }: TargetInput) => statuses[to]?.phase === phase;
  const move = ({ to }: TargetInput) =>
    run({
      action: () =>
        reorderBookingStatusesAction({
          ids: swap({ ids: statuses.map((status) => status.id), from: index, to }),
        }),
      messages: { pending: t("reordering"), success: t("reordered") },
      onSuccess: () => router.refresh(),
    });
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("moveUp")}
        disabled={pending || !canMove({ to: index - 1 })}
        onClick={() => move({ to: index - 1 })}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("moveDown")}
        disabled={pending || !canMove({ to: index + 1 })}
        onClick={() => move({ to: index + 1 })}
      >
        <ArrowDownIcon />
      </Button>
    </div>
  );
}
