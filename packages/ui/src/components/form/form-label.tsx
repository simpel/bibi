"use client";

import { cn } from "../../lib/cn";
import { Label, type LabelProps } from "../label/label";
import { useFormField } from "./form-context";

export function FormLabel({ className, ...props }: LabelProps) {
  const { error, formItemId } = useFormField();
  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}
