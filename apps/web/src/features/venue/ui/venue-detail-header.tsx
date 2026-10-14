import type { VenueDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Badge } from "@okazi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { VenueRowActions } from "./venue-row-actions";

export type VenueDetailHeaderProps = { venue: VenueDto };

export async function VenueDetailHeader({ venue }: VenueDetailHeaderProps) {
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
        actions={<VenueRowActions venue={venue} redirectToList />}
      />
      <Badge variant="success">{common("active")}</Badge>
    </div>
  );
}
