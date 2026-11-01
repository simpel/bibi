"use client";

import { Button, Input, Label } from "@bibi/ui";
import { CopyIcon } from "lucide-react";
import { type CopyMessages, copyToClipboard } from "@/lib/copy-to-clipboard";

export type CopyFieldProps = {
  id: string;
  label: string;
  value: string;
  messages: CopyMessages & { copy: string };
};

/** A read-only value with a copy button, e.g. a new API key or the MCP server's address. */
export function CopyField({ id, label, value, messages }: CopyFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={value} className="font-mono" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => copyToClipboard({ value, messages })}
          aria-label={messages.copy}
        >
          <CopyIcon />
        </Button>
      </div>
    </div>
  );
}
