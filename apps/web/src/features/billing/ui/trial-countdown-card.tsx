import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { HourglassIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { payPath } from "../lib/return-to";
import type { TrialCountdown } from "../lib/trial-countdown";

/** Paying opens the plan picker, then Stripe Checkout; afterwards the member lands on My work. */
const PAY_HREF = payPath({ returnTo: "/" });

export type TrialCountdownCardProps = { trial: TrialCountdown };

/**
 * The free trial's countdown at the foot of the sidebar (ADR 0095 §4): days left, a bar that
 * empties as the trial runs out and, for whoever may pay, the way to pick a plan. One icon with a
 * tooltip while the sidebar is collapsed.
 */
export function TrialCountdownCard({ trial }: TrialCountdownCardProps) {
  const t = useTranslations("billing.trial");
  const left = t(trial.unit === "days" ? "daysLeft" : "hoursLeft", { count: trial.count });
  return (
    <>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton asChild={trial.canPay} tooltip={t("tooltip", { left })}>
            {trial.canPay ? (
              <Link href={PAY_HREF}>
                <HourglassIcon className={cn(trial.urgent && "text-warning")} />
                <span>{left}</span>
              </Link>
            ) : (
              <>
                <HourglassIcon className={cn(trial.urgent && "text-warning")} />
                <span>{left}</span>
              </>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <TrialFullCard trial={trial} left={left} />
    </>
  );
}

type TrialFullCardProps = TrialCountdownCardProps & { left: string };

function TrialFullCard({ trial, left }: TrialFullCardProps) {
  const t = useTranslations("billing.trial");
  return (
    <Card className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="gap-1 p-4 pb-3">
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <HourglassIcon className={cn("size-3.5", trial.urgent && "text-warning")} />
          {t("title")}
        </CardDescription>
        <CardTitle className="text-base tabular-nums">{left}</CardTitle>
        <TrialBar left={trial.left} urgent={trial.urgent} label={t("barLabel")} />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {trial.canPay ? (
          <Button asChild size="sm" className="w-full shadow-none">
            <Link href={PAY_HREF}>{t("pickPlan")}</Link>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">{t("askAdmin")}</p>
        )}
      </CardContent>
    </Card>
  );
}

type TrialBarProps = { left: number; urgent: boolean; label: string };

/** How much of the trial is left, as a bar that runs down. */
function TrialBar({ left, urgent, label }: TrialBarProps) {
  const percent = Math.round(left * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn("h-full rounded-full", urgent ? "bg-warning" : "bg-primary")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
