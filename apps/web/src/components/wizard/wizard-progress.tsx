import { cn } from "@okazi/ui";

export type WizardProgressStep = { id: string; label: string };

export type WizardProgressProps = { steps: WizardProgressStep[]; index: number; label: string };

/** Numbered list of the steps; the current one is marked with `aria-current="step"`. */
export function WizardProgress({ steps, index, label }: WizardProgressProps) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2" aria-label={label}>
      {steps.map((step, position) => (
        <li
          key={step.id}
          aria-current={position === index ? "step" : undefined}
          className={cn(
            "flex items-center gap-2 text-sm",
            position === index ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full border text-xs",
              position <= index && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {position + 1}
          </span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}
