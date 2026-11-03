import type { SeatRequestDto } from "@bibi/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
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
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("requestsTitle")}</CardTitle>
        <CardDescription>{t("requestsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <SeatRequestTable requests={requests} seatPrice={seatPrice} canEdit={canEdit} />
      </CardContent>
    </Card>
  );
}
