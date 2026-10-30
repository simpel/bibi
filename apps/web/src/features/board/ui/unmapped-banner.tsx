import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";

export type UnmappedBannerProps = { count: number; boardId: string | null };

/** For board editors: tickets whose status is on no column of this board, so not shown. */
export function UnmappedBanner({ count, boardId }: UnmappedBannerProps) {
  const t = useTranslations("board");
  return (
    <p
      role="status"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground"
    >
      <TriangleAlertIcon aria-hidden className="size-4" />
      {t("unmapped", { count })}
      <Link
        href={pipelineHref({ boardId, customize: true })}
        className="text-primary hover:underline"
      >
        {t("unmappedLink")}
      </Link>
    </p>
  );
}
