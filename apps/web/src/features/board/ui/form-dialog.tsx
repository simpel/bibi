"use client";

import {
  Button,
  type ButtonProps,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bibi/ui";
import { type ReactNode, useState } from "react";

export type FormDialogProps = {
  /** The trigger's text. */
  label: string;
  title: string;
  icon?: ReactNode;
  variant?: ButtonProps["variant"];
  children: (input: { close: () => void }) => ReactNode;
};

/** A small form in a dialog (create or rename a board): a button opens it, the form closes it. */
export function FormDialog({ label, title, icon, variant = "outline", children }: FormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          {icon}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({ close: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}
