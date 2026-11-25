"use client";

import { DropdownMenuItem } from "@bibi/ui";
import { CircleHelpIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useHelp } from "@/components/help/help-provider";
import { usePathname } from "@/lib/navigation";
import { TOURS, tourForPath } from "./tour-defs";

/** In the user menu on a page that has a tour: shows the tour again. Nothing elsewhere. */
export function TourReplayMenuItem() {
  const t = useTranslations("tour");
  const help = useHelp();
  const customize = useSearchParams().get("mode") === "customize";
  const tour = tourForPath({ pathname: usePathname(), customize });
  if (!tour) return null;
  return (
    <DropdownMenuItem onSelect={() => help.reset({ id: TOURS[tour].hint })}>
      <CircleHelpIcon />
      {t("replay")}
    </DropdownMenuItem>
  );
}
