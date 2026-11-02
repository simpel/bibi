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
import { useEffect, useRef, useState } from "react";
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
  /** Go on at once with the default contact, once there is one (a just-picked customer). */
  autoAdvance?: boolean;
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

type ChooserInput = Pick<ContactChooserProps, "customer" | "initialContactId" | "onDone"> & {
  autoAdvance: boolean;
};

/** The contacts, the picked one (or the default), and the one-time go-on for a picked customer. */
function useContactChoice({ customer, initialContactId, onDone, autoAdvance }: ChooserInput) {
  const { state, added } = useCustomerContacts({ customerId: customer.id });
  const [picked, setPicked] = useState(initialContactId);
  const contacts = state.status === "ready" ? state.contacts : [];
  const contact = contacts.find(({ id }) => id === picked) ?? contacts[0];
  const advancing = autoAdvance && contact !== undefined;
  const advanced = useRef(false);
  useEffect(() => {
    if (!advancing || !contact || advanced.current) return;
    advanced.current = true;
    onDone({ contact });
  }, [advancing, contact, onDone]);
  return { state, added, contact, setPicked, advancing };
}

/**
 * Step 1's contact: the only or first one by default, a picker with several, a form with none.
 * A just-picked customer goes on with the default at once; Change shows the picker.
 */
export function ContactChooser({ autoAdvance = false, ...props }: ContactChooserProps) {
  const t = useTranslations("ticketIntake.who");
  const { state, added, contact, setPicked, advancing } = useContactChoice({
    ...props,
    autoAdvance,
  });
  if (state.status === "loading" || advancing) return <Skeleton className="h-9 w-64" />;
  if (state.status === "error") return <InlineLoadError errorKey={state.errorKey} />;
  if (state.contacts.length === 0) {
    const { customer, contactTypes } = props;
    return <AddContactForm customer={customer} contactTypes={contactTypes} onCreated={added} />;
  }
  return (
    <div className="grid gap-4">
      <ContactPicker contacts={state.contacts} value={contact?.id ?? ""} onChange={setPicked} />
      <Button
        type="button"
        className="justify-self-start"
        disabled={!contact}
        onClick={() => contact && props.onDone({ contact })}
      >
        {t("next")}
      </Button>
    </div>
  );
}
