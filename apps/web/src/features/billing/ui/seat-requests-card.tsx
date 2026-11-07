import type { SeatRequestDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { SeatRequestTable } from "./seat-request-table";

export type SeatRequestsCardProps = {
  requests: SeatRequestDto[];
  seatPrice: string;
  canEdit: boolean;
};

/** The held invitations, edge to edge in their card (ADR 0086). */
export async function SeatRequestsCard({ requests, seatPrice, canEdit }: SeatRequestsCardProps) {
  const t = await getTranslations("billing.settings");
  return (
    <AdminSection
      id="seat-requests"
      title={t("requestsTitle")}
      description={t("requestsDescription")}
      flush
    >
      <SeatRequestTable requests={requests} seatPrice={seatPrice} canEdit={canEdit} />
    </AdminSection>
  );
}
