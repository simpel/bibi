"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, createContext, type ReactNode, useContext } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";

export type ConfirmationState = "requested" | "pending" | "accepted" | "rejected";

const confirmationVariants = cva("grid gap-3 rounded-lg border p-4 text-sm", {
  variants: {
    state: {
      requested: "border-primary/40 bg-card",
      pending: "border-primary/40 bg-card",
      accepted: "border-border bg-muted/40",
      rejected: "border-border bg-muted/40",
    },
  },
  defaultVariants: { state: "requested" },
});

const StateContext = createContext<ConfirmationState>("requested");

export type ConfirmationProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof confirmationVariants> & { state: ConfirmationState; children: ReactNode };

/** AI Elements `Confirmation`: the approval request of one proposed change and its outcome. */
export function Confirmation({ state, className, children, ...props }: ConfirmationProps) {
  return (
    <StateContext.Provider value={state}>
      <div
        data-slot="confirmation"
        data-state={state}
        className={cn(confirmationVariants({ state }), className)}
        {...props}
      >
        {children}
      </div>
    </StateContext.Provider>
  );
}

export function ConfirmationTitle({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="confirmation-title" className={cn("font-medium", className)} {...props} />;
}

type WhenProps = ComponentProps<"div"> & { states: readonly ConfirmationState[] };

function When({ states, ...props }: WhenProps) {
  return states.includes(useContext(StateContext)) ? <div {...props} /> : null;
}

/** Shown while the user has not answered. */
export function ConfirmationRequest(props: ComponentProps<"div">) {
  return <When states={["requested", "pending"]} data-slot="confirmation-request" {...props} />;
}

/** Shown after the user approved. */
export function ConfirmationAccepted(props: ComponentProps<"div">) {
  return <When states={["accepted"]} data-slot="confirmation-accepted" {...props} />;
}

/** Shown after the user declined. */
export function ConfirmationRejected(props: ComponentProps<"div">) {
  return <When states={["rejected"]} data-slot="confirmation-rejected" {...props} />;
}

/** The buttons; only while the request is open. */
export function ConfirmationActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <When
      states={["requested", "pending"]}
      data-slot="confirmation-actions"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

export function ConfirmationAction(props: ComponentProps<typeof Button>) {
  return <Button type="button" size="sm" {...props} />;
}
