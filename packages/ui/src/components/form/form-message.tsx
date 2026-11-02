"use client";

import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { useFormField } from "./form-context";

export function FormDescription({ className, ...props }: ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();
  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export type FormMessageProps = ComponentProps<"p"> & {
  /** Shown instead of the error's own text while there is an error (e.g. for an empty field). */
  errorText?: string | undefined;
};

/** The field's error under it, else its children (a hint). */
export function FormMessage({ className, errorText, ...props }: FormMessageProps) {
  const { error, formMessageId } = useFormField();
  const body = error ? (errorText ?? String(error.message ?? "")) : props.children;
  if (!body) return null;
  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}
