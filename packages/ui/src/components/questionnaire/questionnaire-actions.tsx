"use client";

import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { buttonVariants } from "../button/button";

type ButtonLook = VariantProps<typeof buttonVariants>;

export function QuestionnaireActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnairePrevious({
  className,
  size = "default",
  variant = "outline",
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Previous> & ButtonLook) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnaireSkip({
  className,
  size = "default",
  variant = "outline",
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Skip> & ButtonLook) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnaireNext({
  className,
  size = "default",
  variant = "default",
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Next> & ButtonLook) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnaireSubmit({
  className,
  size = "default",
  variant = "default",
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Submit> & ButtonLook) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    />
  );
}
