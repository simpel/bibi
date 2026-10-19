import { listContacts } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { ContactTable } from "./contact-table";
import { CreateContactButton } from "./create-contact-button";

export type ContactSectionProps = { locale: Locale; customerId: string };

/** The customer's contact persons: a table with edit and archive, and a create button. */
export async function ContactSection({ locale, customerId }: ContactSectionProps) {
  const t = await getTranslations("contact");
  const abilities = await getCallerAbilities();
  const access = {
    canEdit: can({ abilities, permission: "customer:edit" }),
    canRemove: can({ abilities, permission: "customer:remove" }),
  };
  const [contacts, data] = await Promise.all([
    runOperation({ operation: listContacts, input: { customerId, limit: 100 } }),
    loadTypedFormData({ base: "CONTACT" }),
  ]);
  if (!contacts.ok) {
    return <ErrorState errorKey={handleLoadError({ error: contacts.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {can({ abilities, permission: "customer:create" }) && !noTypes ? (
          <CreateContactButton customerId={customerId} data={data.value} />
        ) : null}
      </div>
      {contacts.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{noTypes ? t("noTypes") : t("empty")}</p>
      ) : (
        <ContactTable contacts={contacts.value.items} data={data.value} access={access} />
      )}
    </section>
  );
}
