import { getEnv } from "@bibi/config";
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
import { ProvisionForm } from "./provision-form";

const WEBHOOK_PATH = "/api/webhooks/stripe-billing";

/** The app's own webhook URL when it is https; Stripe refuses anything else. */
function defaultWebhookUrl(): string {
  const url = `${getEnv().WEB_URL.replace(/\/$/, "")}${WEBHOOK_PATH}`;
  return url.startsWith("https://") ? url : "";
}

export type ConfigCardProps = { config: BillingConfigDto };

/** Bibi's Stripe account: the stored key (test or live), the prices and "Create in Stripe". */
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
        <section className="grid gap-3">
          <div className="grid gap-1">
            <h2 className="text-base">{t("provision.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("provision.description")}</p>
          </div>
          <ProvisionForm
            defaultWebhookUrl={defaultWebhookUrl()}
            hasKey={config.secretKeyHint !== null}
          />
        </section>
      </CardContent>
    </Card>
  );
}
