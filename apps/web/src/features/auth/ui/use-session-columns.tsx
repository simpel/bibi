import { Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { describeUserAgent } from "@/lib/user-agent";
import type { SessionRow } from "./session-row";

type Column = ColumnDef<SessionRow>;

export type UseSessionColumnsInput = { current: string | undefined };

/** Device (`Chrome on macOS`, this session marked) · signed in · last active. */
export function useSessionColumns({ current }: UseSessionColumnsInput): Column[] {
  const t = useTranslations("profile");
  const format = useDateTimeFormat();
  return useMemo<Column[]>(() => {
    const device = ({ row }: { row: SessionRow }) => {
      const { browser, os } = describeUserAgent({ userAgent: row.userAgent });
      if (browser && os) return t("device", { browser, os });
      return browser ?? os ?? t("unknownDevice");
    };
    return [
      {
        id: "device",
        header: t("sessionColumns.device"),
        accessorFn: (row) => device({ row }),
        cell: ({ row }) => (
          <span
            className="flex items-center gap-2 font-medium"
            title={row.original.userAgent ?? ""}
          >
            {device({ row: row.original })}
            {row.original.id === current ? <Badge>{t("thisSession")}</Badge> : null}
          </span>
        ),
      },
      {
        id: "signedIn",
        header: t("sessionColumns.signedIn"),
        accessorFn: (row) => new Date(row.createdAt).getTime(),
        cell: ({ row }) => format.dateTime({ instant: row.original.createdAt }),
      },
      {
        id: "lastActive",
        header: t("sessionColumns.lastActive"),
        accessorFn: (row) => new Date(row.updatedAt).getTime(),
        cell: ({ row }) => format.dateTime({ instant: row.original.updatedAt }),
      },
    ];
  }, [t, format, current]);
}
