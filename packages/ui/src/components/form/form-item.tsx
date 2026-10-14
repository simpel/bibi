"use client";

import { type ComponentProps, useId } from "react";
import { cn } from "../../lib/cn";
import { FormItemContext } from "./form-context";

export function FormItem({ className, ...props }: ComponentProps<"div">) {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}
