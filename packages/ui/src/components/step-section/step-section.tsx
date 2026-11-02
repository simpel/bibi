import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { StepSectionFooter } from "./step-section-footer";

export const stepSectionVariants = cva(
  "grid gap-4 rounded-lg border bg-card p-4 transition-colors",
  {
    variants: {
      state: {
        open: "border-primary/40 shadow-xs",
        done: "border-border",
        locked: "border-dashed border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { state: "open" },
  },
);

export const stepNumberVariants = cva(
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums",
  {
    variants: {
      state: {
        open: "bg-primary text-primary-foreground",
        done: "bg-success/15 text-success",
        locked: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: { state: "open" },
  },
);

export type StepSectionState = NonNullable<VariantProps<typeof stepSectionVariants>["state"]>;

export type StepSectionProps = Omit<ComponentProps<"section">, "title"> &
  VariantProps<typeof stepSectionVariants> & {
    /** The step's place in the flow, from 1. */
    number: number;
    title: ReactNode;
    /** One line shown while the step is done. */
    summary?: ReactNode;
    /** Label of the button that reopens a done step (localised by the caller). */
    changeLabel?: string;
    onChangeStep?: () => void;
    /** The step's own commands, right on the title row; shown only while the step is open. */
    actions?: ReactNode;
    /** Bottom left while open, e.g. a ghost Back. */
    footerStart?: ReactNode;
    /** Bottom right while open, e.g. Next. */
    footerEnd?: ReactNode;
  };

type StepHeaderProps = Pick<
  StepSectionProps,
  "number" | "title" | "summary" | "changeLabel" | "onChangeStep" | "actions"
> & { state: StepSectionState };

function StepHeader(props: StepHeaderProps) {
  const { number, title, summary, changeLabel, onChangeStep, actions, state } = props;
  const done = state === "done";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span data-slot="step-section-number" className={stepNumberVariants({ state })}>
        {done ? <CheckIcon className="size-4" aria-hidden="true" /> : number}
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <h2 className="text-base font-semibold leading-snug">{title}</h2>
        {done && summary ? (
          <p data-slot="step-section-summary" className="truncate text-sm text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>
      {state === "open" && actions ? (
        <div data-slot="step-section-actions" className="flex shrink-0 flex-wrap gap-2">
          {actions}
        </div>
      ) : null}
      {done && changeLabel && onChangeStep ? (
        <Button type="button" variant="ghost" size="sm" onClick={onChangeStep}>
          {changeLabel}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * One step of a single-page flow: open (takes input), done (a one-line summary with Change) or
 * locked (not reached yet). Only an open step renders its children, its title-row `actions` and
 * its footer (Back left, Next right).
 */
export function StepSection({
  className,
  state,
  number,
  title,
  summary,
  changeLabel,
  onChangeStep,
  actions,
  footerStart,
  footerEnd,
  children,
  ...props
}: StepSectionProps) {
  const current: StepSectionState = state ?? "open";
  const open = current === "open";
  return (
    <section
      data-slot="step-section"
      data-state={current}
      aria-current={current === "open" ? "step" : undefined}
      className={cn(stepSectionVariants({ state: current }), className)}
      {...props}
    >
      <StepHeader
        {...{ number, title, summary, changeLabel, onChangeStep, actions }}
        state={current}
      />
      {open ? <div className="grid gap-4">{children}</div> : null}
      {open ? <StepSectionFooter start={footerStart} end={footerEnd} /> : null}
    </section>
  );
}
