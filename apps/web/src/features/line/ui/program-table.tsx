"use client";

import type { LineAmounts, LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { actionWithToast } from "@/lib/action-with-toast";
import { useRouter } from "@/lib/navigation";
import {
  batchChangeLineStateAction,
  changeLineStateAction,
  followLineStatusAction,
} from "../actions";
import { ProgramBulkActions } from "./program-bulk-actions";
import { ProgramDialogs } from "./program-dialogs";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";
import { type ProgramDialogType, ProgramRowMenu } from "./program-row-menu";
import { useProgramColumns } from "./use-program-columns";

export type ProgramTableProps = {
  lines: LineDto[];
  data: ProgramFormData;
  access: ProgramAccess;
  /** The lines' amounts and the order's total (`line.amounts`); null when it failed to load. */
  amounts: LineAmounts | null;
  /** Drawn inside a shared card: no border or rounding of its own. */
  flush?: boolean;
};

/**
 * The run schedule table:
 * Selection · State dropdown with pulse · Name (clickable) · Where · Time (hours) · Quantity · Total Amount.
 * Single Pen action button and full right-click context menu with Edit first.
 */
export function ProgramTable({ lines, data, access, amounts, flush }: ProgramTableProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [linesState, setLinesState] = useState(lines);
  const [pendingLineIds, setPendingLineIds] = useState<Set<string>>(new Set());
  const [activeDialog, setActiveDialog] = useState<{
    line: LineDto;
    dialog: ProgramDialogType;
  } | null>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    setLinesState(lines);
  }, [lines]);

  const handleStateChange = ({ lineId, stateId }: { lineId: string; stateId: string }) => {
    setLinesState((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, stateId, stateOverridden: true } : l)),
    );
    setPendingLineIds((prev) => new Set(prev).add(lineId));

    startTransition(async () => {
      const result = await actionWithToast({
        action: () => changeLineStateAction({ lineId, stateId }),
        messages: { pending: common("saving"), success: t("stateChanged") },
        translate: ({ key }) => errors(key),
      });

      if (result.ok) {
        router.refresh();
      } else {
        setLinesState(lines);
      }

      setPendingLineIds((prev) => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    });
  };

  const handleBatchChangeState = ({ lineIds, stateId }: { lineIds: string[]; stateId: string }) => {
    setLinesState((prev) =>
      prev.map((l) => (lineIds.includes(l.id) ? { ...l, stateId, stateOverridden: true } : l)),
    );
    setPendingLineIds((prev) => {
      const next = new Set(prev);
      for (const id of lineIds) next.add(id);
      return next;
    });

    startTransition(async () => {
      const result = await actionWithToast({
        action: () => batchChangeLineStateAction({ lineIds, stateId }),
        messages: { pending: common("saving"), success: t("stateChanged") },
        translate: ({ key }) => errors(key),
      });

      if (result.ok) {
        router.refresh();
      } else {
        setLinesState(lines);
      }

      setPendingLineIds((prev) => {
        const next = new Set(prev);
        for (const id of lineIds) next.delete(id);
        return next;
      });
    });
  };

  const handleFollowStatus = ({ lineId }: { lineId: string }) => {
    setLinesState((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, stateOverridden: false } : l)),
    );
    setPendingLineIds((prev) => new Set(prev).add(lineId));

    startTransition(async () => {
      const result = await actionWithToast({
        action: () => followLineStatusAction({ lineId }),
        messages: { pending: common("saving"), success: t("stateChanged") },
        translate: ({ key }) => errors(key),
      });

      if (result.ok) {
        router.refresh();
      } else {
        setLinesState(lines);
      }

      setPendingLineIds((prev) => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    });
  };

  const columns = useProgramColumns({
    data,
    access,
    amounts,
    pendingLineIds,
    onStateChange: handleStateChange,
    onFollowStatus: handleFollowStatus,
    onEdit: (line) => setActiveDialog({ line, dialog: "edit" }),
  });

  return (
    <>
      <PersistedDataTable
        tableId="line.list"
        flush={flush}
        columns={columns}
        data={linesState}
        getRowId={(item) => item.id}
        emptyText={t("empty")}
        selectable={access.canChangeState}
        bulkActions={(selected) => (
          <ProgramBulkActions
            selected={selected}
            data={data}
            access={access}
            onBatchChangeState={handleBatchChangeState}
          />
        )}
        rowMenu={(row) => (
          <ProgramRowMenu
            line={row}
            data={data}
            access={access}
            onOpenDialog={setActiveDialog}
            onStateChange={handleStateChange}
            onFollowStatus={handleFollowStatus}
          />
        )}
      />

      <ProgramDialogs
        active={activeDialog}
        onClose={() => setActiveDialog(null)}
        data={data}
        lines={linesState}
        access={access}
      />
    </>
  );
}
