import { Wordmark } from "@bibi/ui";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type StatusPageProps = {
  /** The HTTP status shown as the large figure behind the title ("404", "500"). */
  code: string;
  title: string;
  description: string;
  /** Buttons under the text, the main one first. */
  actions: ReactNode;
  /** Small print under the actions, e.g. an error reference for support. */
  footnote?: ReactNode;
};

/**
 * A whole-screen page for a missing page or a crash: the wordmark at the top, a large serif status
 * figure with the title set over it, and a way onward. Shared by `not-found.tsx` and `error.tsx`.
 */
export function StatusPage({ code, title, description, actions, footnote }: StatusPageProps) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-radial-[ellipse_at_top] from-accent to-transparent"
      />
      <header className="relative px-6 py-5">
        <Link href={ROUTES.app} className="inline-flex rounded-md focus-visible:outline-2">
          <Wordmark size="sm" />
        </Link>
      </header>
      <div className="relative flex flex-1 items-center justify-center px-6 pb-24">
        <div className="grid max-w-lg justify-items-center text-center">
          <p
            aria-hidden
            className="select-none font-serif text-[9rem] leading-none font-light tracking-tighter text-primary/15 tabular-nums sm:text-[12rem]"
          >
            {code}
          </p>
          <h1 className="-mt-10 text-3xl text-balance sm:-mt-14 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-pretty text-muted-foreground">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">{actions}</div>
          {footnote ? <div className="mt-8 text-xs text-muted-foreground">{footnote}</div> : null}
        </div>
      </div>
    </main>
  );
}
