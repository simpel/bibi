import type { BillingConfigDto } from "@bibi/core";
import {
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { BillingConfigForm } from "./billing-config-form";
import { PlanProducts } from "./plan-products";

export type ConfigCardProps = { config: BillingConfigDto };

/** Bibi's Stripe account: the stored key (test or live) and the products it sells. */
export async function ConfigCard({ config }: ConfigCardProps) {
  const t = await getTranslations("admin.billing");
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("config.title")}</CardTitle>
        <CardDescription>
          {config.configured ? t("config.configured") : t("config.notConfigured")}
        </CardDescription>
        <CardAction className="flex gap-2">
          {config.secretKeyHint ? (
            <Badge variant={config.livemode ? "success" : "warning"}>
              {config.livemode ? t("config.live") : t("config.test")}
            </Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-8">
        <BillingConfigForm config={config} />
        <PlanProducts config={config} />
      </CardContent>
    </Card>
  );
}
