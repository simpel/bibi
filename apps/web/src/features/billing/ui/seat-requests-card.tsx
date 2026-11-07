import type { SeatRequestDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { SeatRequestTable } from "./seat-request-table";

export type SeatRequestsCardProps = {
  requests: SeatRequestDto[];
  seatPrice: string;
  canEdit: boolean;
};

/** The invitations held for a seat. */
export async function SeatRequestsCard({ requests, seatPrice, canEdit }: SeatRequestsCardProps) {
  if (requests.length === 0) return null;
  const t = await getTranslations("billing.settings");
  return (
    <AdminSection section="seatRequests" description={t("requestsDescription")}>
      <SeatRequestTable requests={requests} seatPrice={seatPrice} canEdit={canEdit} />
    </AdminSection>
  );
}
