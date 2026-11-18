"use client";

import { HelpPanel } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { HelpHintId } from "./help-hints";
import { useHelp } from "./help-provider";

export type HelpHintProps = {
  id: HelpHintId;
  children: ReactNode;
  /** Fixed at the bottom centre of the screen (a legend); else in the page's flow (a tip). */
  floating?: boolean;
  className?: string;
};

/** A legend or tip with an X: once the user closes it, it never shows for them again. */
export function HelpHint({ id, children, floating, className }: HelpHintProps) {
  const t = useTranslations("helpHint");
  const help = useHelp();
  if (help.isDismissed({ id })) return null;
  return (
    <HelpPanel
      floating={floating}
      className={className}
      dismissLabel={t("dismiss")}
      onDismiss={() => help.dismiss({ id })}
    >
      {children}
    </HelpPanel>
  );
}
