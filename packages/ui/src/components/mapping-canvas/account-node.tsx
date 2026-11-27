"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { XIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { ACCOUNT_WIDTH, type AccountNode } from "./build-graph";
import { useMappingContext } from "./mapping-context";

export function AccountNodeView({ data }: NodeProps<AccountNode>) {
  const { account, state, pinnedOnly } = data;
  const { labels, disabled, onUnpin } = useMappingContext();
  return (
    <div
      data-slot="mapping-account"
      style={{ width: ACCOUNT_WIDTH }}
      className={cn(
        "relative flex items-start gap-2 rounded-lg border bg-card px-3 py-2 text-card-foreground shadow-xs",
        state === "attention" && "border-warning",
        state === "ok" && "border-success",
        account.inactive && "bg-muted text-muted-foreground",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={!disabled}
        className="size-3! border-2! border-background! bg-muted-foreground!"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{account.label}</p>
        {account.detail ? (
          <p className="truncate text-xs text-muted-foreground">{account.detail}</p>
        ) : null}
        {account.inactive ? <p className="text-xs">{labels.inactive}</p> : null}
      </div>
      {pinnedOnly && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="nodrag nopan -my-1 -mr-2 size-7"
          aria-label={labels.removeLine}
          onClick={() => onUnpin({ accountId: account.id })}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
