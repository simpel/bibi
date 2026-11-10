"use client";

import { Card, CardContent, CardHeader, CardTitle, ProviderLogo } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { IntegrationStatusBadge } from "@/features/integration/ui/integration-status-badge";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type IntegrationCardViewProps = GenerativeProps<"integration-card">;

/** The organization's connections to outside systems: status, company and, while connecting, the link. */
export function IntegrationCardView({ items, authorizeUrl }: IntegrationCardViewProps) {
  const t = useTranslations("assistant.ui.integration");
  const providers = useTranslations("providers");
  return (
    <Card data-slot="integration-card" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm">
        {items.map((item) => (
          <div key={item.provider} className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <ProviderLogo provider={item.provider} className="size-4 w-auto" aria-hidden />
              {providers(`${item.provider}.name`)}
              {item.companyName && item.organizationNumber
                ? `: ${t("company", { company: item.companyName, number: item.organizationNumber })}`
                : null}
            </span>
            <IntegrationStatusBadge status={item.status} />
            {item.configured ? null : (
              <span className="basis-full text-muted-foreground">{t("unavailable")}</span>
            )}
          </div>
        ))}
        {authorizeUrl && items[0] ? (
          <a href={authorizeUrl} className="text-primary hover:underline">
            {t("approve", { name: providers(`${items[0].provider}.name`) })}
          </a>
        ) : null}
        <Link href={ROUTES.adminIntegrations} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
