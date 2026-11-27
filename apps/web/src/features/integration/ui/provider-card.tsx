import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProviderLogo,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { integrationRoute } from "@/lib/routes";
import { loadProviderGuide } from "../server/provider-guide";
import { ConnectProviderButton } from "./connect-provider-button";
import { DisconnectProviderButton } from "./disconnect-provider-button";
import { HowToConnectButton, type ProviderGuide } from "./how-to-connect-button";
import { IntegrationNotice, type IntegrationOutcome } from "./integration-notice";
import { IntegrationStatusBadge, isConnectionUsable } from "./integration-status-badge";
import { RefreshProviderButton } from "./refresh-provider-button";

export type ProviderCardProps = {
  connection: IntegrationConnectionDto;
  canEdit: boolean;
  /** What happened when this provider sent the admin back; only a failure is shown. */
  outcome: IntegrationOutcome | null;
};

type ProviderActionsProps = Pick<ProviderCardProps, "connection"> & {
  name: string;
  /** Not read for a connected provider: it has nothing left to set up. */
  guide: ProviderGuide | null;
};

/**
 * The actions the connection's status allows. Connected: the primary Settings button to its page
 * (everything else lives there). Otherwise "How to connect" on the left and the primary connect
 * (or reconnect, continue) on the right.
 */
function ProviderActions({ connection, name, guide }: ProviderActionsProps) {
  const t = useTranslations("integration.card");
  const { status, connectKind } = connection;
  const live = status !== "NOT_CONNECTED" && status !== "DISCONNECTED";
  const hostedOpen = connectKind === "HOSTED_ONBOARDING" && live && status !== "CONNECTED";
  if (status === "CONNECTED") {
    return (
      <Button asChild>
        <Link href={integrationRoute({ provider: connection.provider })}>{t("settings")}</Link>
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {guide ? <HowToConnectButton guide={guide} /> : <span />}
      <div className="flex flex-wrap gap-2">
        {live ? <DisconnectProviderButton connection={connection} name={name} /> : null}
        {hostedOpen ? <RefreshProviderButton /> : null}
        <ConnectProviderButton connection={connection} name={name} guide={guide} />
      </div>
    </div>
  );
}

/**
 * One provider on Administration → Integrations (ADR 0100), drawn from `integration.list`: its
 * status and the one action that fits it. A connected provider only links to its settings page
 * (`ProviderDetail`); connecting, reconnecting and the how-to stay here.
 */
export async function ProviderCard({ connection, canEdit, outcome }: ProviderCardProps) {
  const [t, providers] = await Promise.all([
    getTranslations("integration.card"),
    getTranslations("providers"),
  ]);
  const { provider, status, configured, setupIssues } = connection;
  const name = providers(`${provider}.name`);
  const usable = isConnectionUsable({ status, configured });
  const guide = status === "CONNECTED" ? null : await loadProviderGuide({ provider, name });
  // A working connection needs no sentence: the badge and the company facts say it.
  const hint = !usable
    ? t("hint.UNAVAILABLE", { name })
    : status === "CONNECTED"
      ? null
      : t(`hint.${status}`, { name });
  return (
    <Card
      data-slot="provider-card"
      id={`provider-${provider.toLowerCase()}`}
      className="shadow-none"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ProviderLogo provider={provider} className="size-5 w-auto" aria-hidden />
          {name}
        </CardTitle>
        <CardDescription>{providers(`${provider}.description`)}</CardDescription>
        <CardAction>
          <IntegrationStatusBadge
            status={status}
            configured={configured}
            issues={setupIssues.length}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        {outcome ? <IntegrationNotice outcome={outcome} name={name} /> : null}
        {hint ? <p>{hint}</p> : null}
        {status === "CONNECTED" && connection.companyName ? (
          <p className="text-foreground">{connection.companyName}</p>
        ) : null}
        {configured || !usable ? null : <p>{t("notConfigured", { name })}</p>}
        {canEdit || status === "CONNECTED" ? (
          <ProviderActions connection={connection} name={name} guide={guide} />
        ) : null}
      </CardContent>
    </Card>
  );
}
