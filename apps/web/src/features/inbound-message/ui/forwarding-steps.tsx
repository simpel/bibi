import { getTranslations } from "next-intl/server";

export type ForwardingStepsProps = {
  /** The full inbox address mail is forwarded to. */
  address: string;
  /** The venue's own address, or null when not entered yet. */
  publicAddress: string | null;
};

const PROVIDERS = [
  { key: "microsoft", steps: ["microsoft.one", "microsoft.two", "microsoft.three"] },
  { key: "google", steps: ["google.one", "google.two", "google.three", "google.four"] },
] as const;

/** How to forward the venue's own address to the inbox in Microsoft 365 and Google Workspace. */
export async function ForwardingSteps({ address, publicAddress }: ForwardingStepsProps) {
  const t = await getTranslations("inbox.settings.forwarding");
  const own = publicAddress ?? t("yourAddress");
  const rich = ({ key }: { key: Parameters<typeof t.rich>[0] }) =>
    t.rich(key, {
      address,
      own,
      code: (chunks) => <code className="text-foreground">{chunks}</code>,
    });
  return (
    <div className="grid content-start gap-5 text-sm">
      <p>{rich({ key: "intro" })}</p>
      {PROVIDERS.map(({ key, steps }) => (
        <section key={key} className="grid gap-2">
          <h3 className="font-medium">{t(`${key}.title`)}</h3>
          <ol className="grid list-decimal gap-1.5 pl-5 text-muted-foreground">
            {steps.map((step) => (
              <li key={step}>{rich({ key: step })}</li>
            ))}
          </ol>
          <p className="text-muted-foreground">{rich({ key: `${key}.note` })}</p>
        </section>
      ))}
      <p className="text-muted-foreground">{rich({ key: "other" })}</p>
      <p className="text-muted-foreground">{t("test")}</p>
    </div>
  );
}
