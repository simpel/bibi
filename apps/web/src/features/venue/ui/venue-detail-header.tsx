import type { VenueDto } from "@bibi/core";
import { Badge } from "@bibi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/states/page-header";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { VenueRowActions } from "./venue-row-actions";

export type VenueDetailHeaderProps = {
  venue: VenueDto;
  access: RowAccess;
  /** The history list for the "View history" menu entry; `null` without `audit:read`. */
  history?: ReactNode | null;
};

export async function VenueDetailHeader({ venue, access, history }: VenueDetailHeaderProps) {
  const common = await getTranslations("common");
  return (
    <div className="grid gap-4">
      <Link
        href={ROUTES.venues}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader
        title={venue.name}
        description={venue.description ?? undefined}
        actions={
          access.canEdit || access.canRemove || history ? (
            <VenueRowActions venue={venue} redirectToList access={access} history={history} />
          ) : undefined
        }
      />
      <Badge variant="success">{common("active")}</Badge>
    </div>
  );
}
