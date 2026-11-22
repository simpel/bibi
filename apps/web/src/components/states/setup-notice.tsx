import { Alert, AlertDescription, Button } from "@bibi/ui";
import { AlertCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";

export type SetupNoticeProps = {
  /** What is not set up and what that stops, in one or two sentences. */
  children: ReactNode;
  /** Where it is set up, for a caller who may do it. */
  action?: { href: string; label: string };
  slot?: string;
};

/**
 * The one look for a section that cannot work until something is set up (an accounting system,
 * an inbound address): a quiet notice in place of the section's actions, with the way there.
 */
export function SetupNotice({ children, action, slot }: SetupNoticeProps) {
  return (
    <Alert data-slot={slot ?? "setup-notice"}>
      <AlertCircleIcon className="size-4" />
      <div className="col-start-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AlertDescription className="text-foreground">{children}</AlertDescription>
        {action ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 self-start sm:self-center"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
