import type { ReactNode } from "react";
import { HelpHint } from "./help-hint";
import type { HelpHintId } from "./help-hints";

export type HelpTipProps = {
  id: HelpHintId;
  /** One short line in bold, e.g. "How moves work". */
  title: string;
  /** Two or three short sentences. */
  children: ReactNode;
  className?: string;
};

/** An inline tip near what it explains: a bold line and a few sentences, closed for good with X. */
export function HelpTip({ id, title, children, className }: HelpTipProps) {
  return (
    <HelpHint id={id} className={className}>
      <div className="grid gap-0.5 py-0.5 text-xs">
        <p className="font-medium text-foreground">{title}</p>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </HelpHint>
  );
}
