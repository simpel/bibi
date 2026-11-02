import type { ContactDto } from "@bibi/core";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { InlineLoadError } from "@/components/states/inline-load-error";
import type { CustomerOption } from "../../customer/actions";
import { AddContactForm } from "./add-contact-form";
import { useCustomerContacts } from "./use-customer-contacts";

export type ContactChooserProps = {
  customer: CustomerOption;
  contactTypes: NamedOption[];
  /** The contact chosen before (Change keeps it when it is still there). */
  initialContactId: string | null;
  onDone: (input: { contact: ContactDto }) => void;
};

type PickerProps = { contacts: ContactDto[]; value: string; onChange: (id: string) => void };

/** One contact is shown by name; several get a picker. */
function ContactPicker({ contacts, value, onChange }: PickerProps) {
  const t = useTranslations("ticketIntake.who");
  if (contacts.length === 1) {
    return <p className="text-sm">{t("contactIs", { contact: contacts[0]?.name ?? "" })}</p>;
  }
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="intake-contact">{t("contact")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="intake-contact">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {contacts.map((contact) => (
            <SelectItem key={contact.id} value={contact.id}>
              {contact.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Step 1's contact: the only or first one by default, a picker with several, a form with none. */
export function ContactChooser({
  customer,
  contactTypes,
  initialContactId,
  onDone,
}: ContactChooserProps) {
  const t = useTranslations("ticketIntake.who");
  const { state, added } = useCustomerContacts({ customerId: customer.id });
  const [picked, setPicked] = useState(initialContactId);
  if (state.status === "loading") return <Skeleton className="h-9 w-64" />;
  if (state.status === "error") return <InlineLoadError errorKey={state.errorKey} />;
  if (state.contacts.length === 0) {
    return <AddContactForm customer={customer} contactTypes={contactTypes} onCreated={added} />;
  }
  const contact = state.contacts.find(({ id }) => id === picked) ?? state.contacts[0];
  return (
    <div className="grid gap-4">
      <ContactPicker contacts={state.contacts} value={contact?.id ?? ""} onChange={setPicked} />
      <Button
        type="button"
        className="justify-self-start"
        disabled={!contact}
        onClick={() => contact && onDone({ contact })}
      >
        {t("next")}
      </Button>
    </div>
  );
}
