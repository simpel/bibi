import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type WelcomeStepFrameProps = {
  title: string;
  description?: string;
  /** "Step n of m"; omitted on pages that are not part of a sequence. */
  progress?: { step: number; total: number };
  /** `wide` for the 3×3 grid; everything else reads best narrow. */
  width?: "narrow" | "wide";
  children: ReactNode;
};

/** The heading block and body of one welcome page. */
export function WelcomeStepFrame({
  title,
  description,
  progress,
  width = "narrow",
  children,
}: WelcomeStepFrameProps) {
  const t = useTranslations("welcome");
  return (
    <section className={cn("grid w-full gap-6", width === "wide" ? "max-w-4xl" : "max-w-xl")}>
      <div className="grid gap-2 text-center">
        {progress ? (
          <p className="text-sm text-muted-foreground">
            {t("stepOf", { step: progress.step, total: progress.total })}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
