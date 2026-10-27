"use client";

import { CopyIcon } from "lucide-react";
import { Button } from "../button/button";
import { toast } from "../toast/toast";
import { useContactLabels } from "./contact-labels";

export type CopyValueButtonProps = {
  /** What is copied: a number or an address, as shown. */
  value: string;
  /** What it is, for the button's name and the toast: "Phone", "Email". */
  label: string;
};

/** Copies one way to reach someone, then says so in a toast (or that it failed). */
export function CopyValueButton({ value, label }: CopyValueButtonProps) {
  const labels = useContactLabels();
  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => toast.success(labels.copied({ label })),
      () => toast.error(labels.copyFailed),
    );
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={copy}
      aria-label={labels.copy({ label })}
      title={labels.copy({ label })}
    >
      <CopyIcon aria-hidden />
    </Button>
  );
}
