import type { PlacedElement } from "@bibi/core/schemas";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type KindMap, seatTotal } from "../lib/draft";
import { buildTemplate, type Room, type TemplateKey } from "../lib/layout-templates";
import type { LayoutCommands } from "./use-layout-commands";

export type UseTemplateStartInput = {
  room: Room;
  kinds: KindMap;
  fixed: readonly PlacedElement[];
  commands: LayoutCommands;
  /** People for "start over" from the menu: the capacity, else the seats. */
  people: number;
};

/** Filling a layout from a template: the empty layout's start card and "start over". */
export function useTemplateStart({ room, kinds, fixed, commands, people }: UseTemplateStartInput) {
  const t = useTranslations("floorPlan.start");
  const [showStart, setShowStart] = useState(true);
  const start = ({ template, people: wanted }: { template: TemplateKey; people: number }) => {
    const elements = buildTemplate({ template, people: wanted, room, kinds, fixed });
    commands.replaceAll(elements);
    setShowStart(false);
    const placed = seatTotal({ elements, kinds });
    if (placed < wanted) toast.info(t("partial", { placed, wanted }));
  };
  return {
    showStart,
    start,
    replace: (template: TemplateKey) => start({ template, people: Math.max(1, people) }),
    dismiss: () => setShowStart(false),
  };
}
