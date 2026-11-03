import type { BillingDto } from "@bibi/core";
import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getNumberFormat } from "@/server/number-format";
import { AutoAssignSwitch } from "./auto-assign-switch";
import { ExtraSeatsForm } from "./extra-seats-form";

export type SeatsCardProps = { billing: BillingDto; seatPrice: string; canEdit: boolean };

/** Included, extra, used and waiting seats, how new ones are added, and the extra seats. */
export async function SeatsCard({ billing, seatPrice, canEdit }: SeatsCardProps) {
  const t = await getTranslations("billing.settings");
  const numbers = await getNumberFormat();
  const { included, extra, used, held } = billing.seats;
  const figures = [
    { key: "included", value: included },
    { key: "extra", value: extra },
    { key: "used", value: used },
    { key: "held", value: held },
  ] as const;
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("seatsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {figures.map(({ key, value }) => (
            <div key={key} className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">{t(`seats.${key}`)}</dt>
              <dd className="text-lg">{numbers.number({ value })}</dd>
            </div>
          ))}
        </dl>
        <AutoAssignSwitch enabled={billing.autoAssignSeats} canEdit={canEdit} />
        <ExtraSeatsForm extraSeats={extra} seatPrice={seatPrice} canEdit={canEdit} />
      </CardContent>
    </Card>
  );
}
