"use client";

import type { PaymentSettingsDto, IntegrationProvider as ProviderKey } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { type AutoSaveOption, AutoSaveSelect } from "@/components/form/auto-save-select";
import { updatePaymentSettingsAction } from "../actions";

type Routing = Pick<PaymentSettingsDto, "routes" | "choices">;
type Method = PaymentSettingsDto["routes"][number]["method"];
type Choice = ProviderKey | "AUTO";

export type PaymentRoutesEditorProps = {
  settings: Routing;
  /** The providers that are connected now; null when unknown (the label then says nothing). */
  connected: readonly ProviderKey[] | null;
  canEdit: boolean;
  onSaved?: ((input: { value: PaymentSettingsDto }) => void) | undefined;
};

/**
 * One row per payment method (ADR 0100): which provider takes it, or "Automatic" (the connected
 * one that can). Each row saves on change (`paymentSettings.update` with that one route).
 */
export function PaymentRoutesEditor({
  settings,
  connected,
  canEdit,
  onSaved,
}: PaymentRoutesEditorProps) {
  const t = useTranslations("paymentSettings.routes");
  const providers = useTranslations("providers");
  const methods = useTranslations("payment.method");
  const isConnected = ({ provider }: { provider: ProviderKey }) =>
    !connected || connected.includes(provider);
  /**
   * Only a connected service can be picked. A saved route to one that is not connected any more
   * stays visible so the field shows what is saved, but cannot be chosen again.
   */
  const optionsOf = ({
    method,
    saved,
  }: {
    method: Method;
    saved: ProviderKey | null;
  }): AutoSaveOption<Choice>[] => {
    const capable = settings.choices.find((choice) => choice.method === method)?.providers ?? [];
    const listed = saved && !capable.includes(saved) ? [...capable, saved] : capable;
    return [
      { value: "AUTO", label: t("automatic") },
      ...listed.flatMap((provider) => {
        const name = providers(`${provider}.name`);
        if (isConnected({ provider })) return [{ value: provider, label: name }];
        return provider === saved
          ? [{ value: provider, label: t("notConnected", { name }), disabled: true }]
          : [];
      }),
    ];
  };
  return (
    <div className="grid gap-4">
      {settings.routes.map((route) => (
        <AutoSaveSelect
          key={route.method}
          label={methods(route.method)}
          value={route.provider ?? ("AUTO" satisfies Choice)}
          options={optionsOf({ method: route.method, saved: route.provider })}
          canEdit={canEdit}
          save={({ value }) =>
            updatePaymentSettingsAction({
              input: {
                routes: [{ method: route.method, provider: value === "AUTO" ? null : value }],
              },
            })
          }
          saved={t("saved", { method: methods(route.method) })}
          onSaved={onSaved}
        />
      ))}
    </div>
  );
}
