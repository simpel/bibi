import { listInboundEndpoints } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { RelativeTime } from "@/components/relative-time";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ForwardingSteps } from "./forwarding-steps";
import { InboxAddressForm } from "./inbox-address-form";

export type InboxAddressSettingsProps = { locale: Locale };

/**
 * `/admin/general`: the inbox mail address (ADR 0085), the venue's own address that forwards to
 * it, how to set up that forwarding, and when the last mail arrived.
 */
export async function InboxAddressSettings({ locale }: InboxAddressSettingsProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("inbox.settings"),
    getCallerAbilities(),
    runOperation({ operation: listInboundEndpoints, input: { channel: "EMAIL" } }),
  ]);
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminSection section="inboxAddress">
        <ErrorState inline errorKey={errorKey} />
      </AdminSection>
    );
  }
  const endpoint = result.value.items.find((item) => item.active) ?? null;
  const address = endpoint?.address ?? null;
  const domain = address ? (address.split("@")[1] ?? null) : null;
  return (
    <AdminSection section="inboxAddress" description={t("description")}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-3">
          <InboxAddressForm
            localPart={endpoint?.localPart ?? null}
            publicAddress={endpoint?.publicAddress ?? null}
            domain={domain}
            canEdit={can({ abilities, permission: "configuration:write" })}
          />
          <p className="text-sm text-muted-foreground">
            {endpoint?.lastReceivedAt
              ? t.rich("lastReceived", {
                  time: () => <RelativeTime instant={endpoint.lastReceivedAt ?? ""} />,
                })
              : t("noneReceived")}
          </p>
          {endpoint && !address ? (
            <p className="text-sm text-muted-foreground">{t("noDomain")}</p>
          ) : null}
        </div>
        {address ? (
          <ForwardingSteps address={address} publicAddress={endpoint?.publicAddress ?? null} />
        ) : null}
      </div>
    </AdminSection>
  );
}
