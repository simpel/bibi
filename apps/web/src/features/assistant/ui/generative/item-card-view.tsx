"use client";

import { Link } from "@okazi/i18n/navigation";
import {
  Badge,
  BehaviourDisplay,
  BookableDisplay,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ComposableDisplay,
  PricedDisplay,
} from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type ItemCardViewProps = GenerativeProps<"item-card">;

type BehavioursProps = { item: ItemCardViewProps["item"] };

/** The behaviour values of the item, shown with the same displays as the item page. */
function Behaviours({ item }: BehavioursProps) {
  const t = useTranslations("assistant.ui.item");
  const format = useFormatter();
  const amount =
    item.priceMinor === null
      ? null
      : format.number(item.priceMinor / 100, { style: "currency", currency: "SEK" });
  const price = amount && item.priceUnit ? `${amount} ${t(`priceUnit.${item.priceUnit}`)}` : amount;
  const duration =
    item.defaultDurationMinutes === null
      ? null
      : t("duration", { minutes: item.defaultDurationMinutes });
  const setups = item.setups.length > 0 ? [t("setupsCount", { count: item.setups.length })] : [];
  const parts =
    item.components.length > 0 ? [t("componentsCount", { count: item.components.length })] : [];
  return (
    <>
      <PricedDisplay title={t("sections.price")} price={price} />
      <BookableDisplay title={t("sections.booking")} duration={duration} />
      <BehaviourDisplay
        behaviour="SETUPS"
        title={t("sections.setups")}
        rows={setups.map((value) => ({ value }))}
      />
      <ComposableDisplay title={t("sections.components")} parts={parts} />
    </>
  );
}

/** One item: name (link), field values and its behaviours (price, length, setups, parts). */
export function ItemCardView({ item }: ItemCardViewProps) {
  const t = useTranslations("assistant.ui.item");
  const lines = fieldLines({ fields: item.fields });
  return (
    <Card data-slot="item-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={itemRoute({ id: item.id })} className="hover:underline">
            {item.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {item.description ? <p className="text-foreground">{item.description}</p> : null}
        <Behaviours item={item} />
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={itemRoute({ id: item.id })} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
