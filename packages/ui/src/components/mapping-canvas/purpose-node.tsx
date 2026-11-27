"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { TriangleAlertIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { Combobox } from "../combobox/combobox";
import { PURPOSE_WIDTH, type PurposeNode } from "./build-graph";
import { useMappingContext } from "./mapping-context";

export function PurposeNodeView({ data }: NodeProps<PurposeNode>) {
  const { purpose } = data;
  const { labels, accounts, disabled, onConnect, onDisconnect } = useMappingContext();
  const options = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: account.label,
        ...(account.detail ? { description: account.detail } : {}),
      })),
    [accounts],
  );
  const unmapped = purpose.accountId === null;
  return (
    <div
      data-slot="mapping-purpose"
      style={{ width: PURPOSE_WIDTH }}
      className={cn(
        "relative rounded-lg border bg-card p-3 text-card-foreground shadow-xs",
        purpose.state === "attention" && "border-warning",
        purpose.state === "ok" && "border-success",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{purpose.label}</span>
        {unmapped ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {purpose.required ? labels.required : labels.unmapped}
          </span>
        ) : null}
      </div>
      {purpose.hint ? <p className="text-xs text-muted-foreground">{purpose.hint}</p> : null}
      {purpose.stateText ? (
        <p className="mt-1 flex items-start gap-1 text-xs text-foreground">
          <TriangleAlertIcon aria-hidden className="mt-0.5 size-3 shrink-0 text-warning" />
          {purpose.stateText}
        </p>
      ) : null}
      <div className="nodrag nopan nowheel mt-2 flex items-center gap-1">
        <Combobox
          options={options}
          {...(purpose.accountId ? { value: purpose.accountId } : {})}
          onValueChange={(accountId) => onConnect({ purposeId: purpose.id, accountId })}
          placeholder={labels.chooseAccount}
          searchPlaceholder={labels.searchAccounts}
          emptyText={labels.noAccountFound}
          disabled={disabled}
          className="h-8 min-w-0 flex-1"
        />
        {!unmapped && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={labels.removeLine}
            onClick={() => onDisconnect({ purposeId: purpose.id })}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={!disabled}
        className="size-3! border-2! border-background! bg-muted-foreground!"
      />
    </div>
  );
}
