import { getTranslations } from "next-intl/server";

export type SupportContactProps = { email: string | undefined };

/** Closing block: where to turn next. The email line shows only when `SUPPORT_EMAIL` is set. */
export async function SupportContact({ email }: SupportContactProps) {
  const t = await getTranslations("support.contact");
  return (
    <section className="grid gap-3 rounded-2xl bg-muted/60 p-6 sm:p-8">
      <h2 className="text-2xl tracking-tight">{t("title")}</h2>
      <p className="text-muted-foreground">{t("body")}</p>
      {email && (
        <p className="text-muted-foreground">
          {t.rich("email", {
            email: () => (
              <a href={`mailto:${email}`} className="font-medium text-foreground underline">
                {email}
              </a>
            ),
          })}
        </p>
      )}
    </section>
  );
}
