"use client";

import { Button } from "@bibi/ui";
import { CircleHelpIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useHelp } from "@/components/help/help-provider";
import { usePathname } from "@/lib/navigation";
import { TOURS, tourForPath } from "./tour-defs";

export type TourReplayButtonProps = { label: string };

/** In the top bar on a page that has a tour: shows the tour again. Nothing elsewhere. */
export function TourReplayButton({ label }: TourReplayButtonProps) {
  const help = useHelp();
  const customize = useSearchParams().get("mode") === "customize";
  const tour = tourForPath({ pathname: usePathname(), customize });
  if (!tour) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => help.reset({ id: TOURS[tour].hint })}
    >
      <CircleHelpIcon aria-hidden />
    </Button>
  );
}
