import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";

export type WelcomeStepActionsProps = {
  /** Where Back goes; omitted on the first step. */
  back?: { href: string; org?: string };
  pending?: boolean;
  disabled?: boolean;
  /** The submit label; defaults to Continue. */
  label?: string;
  /** Extra content on the left, e.g. "Skip for now". */
  aside?: ReactNode;
};

/** Back and Continue (a submit button) at the bottom of a welcome step. */
export function WelcomeStepActions({
  back,
  pending = false,
  disabled = false,
  label,
  aside,
}: WelcomeStepActionsProps) {
  const t = useTranslations("welcome");
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <div className="flex items-center gap-2">
        {back ? (
          <Button asChild variant="outline">
            <Link href={back.href} org={back.org}>
              {t("back")}
            </Link>
          </Button>
        ) : null}
        {aside}
      </div>
      <Button type="submit" disabled={pending || disabled}>
        {label ?? t("continue")}
      </Button>
    </div>
  );
}
