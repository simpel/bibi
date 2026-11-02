import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import type { CustomerOption } from "../../customer/actions";
import { ContactChooser } from "./contact-chooser";
import { CustomerSearch } from "./customer-search";
import type { IntakeWho } from "./intake-state";
import { NewCustomerForm } from "./new-customer-form";
import { SimilarCustomers } from "./similar-customers";
import type { WhoFlow } from "./use-who-flow";

export type WhoStepProps = {
  who: IntakeWho | null;
  recent: CustomerOption[];
  customerTypes: NamedOption[];
  contactTypes: NamedOption[];
  /** What the customer search starts with (from an inbox message's sender), or null. */
  search?: string | null;
  /** The customer half's state, held by the section (its New customer action drives it). */
  flow: WhoFlow;
  onDone: (input: { who: IntakeWho }) => void;
};

type ChosenProps = Pick<WhoStepProps, "who" | "contactTypes" | "onDone"> & {
  customer: CustomerOption;
  /** Just picked: go on with the default contact (spec "1 · Who"). */
  autoAdvance: boolean;
  onChangeCustomer: () => void;
};

function ChosenCustomer(props: ChosenProps) {
  const { customer, who, contactTypes, autoAdvance, onDone, onChangeCustomer } = props;
  const t = useTranslations("ticketIntake.who");
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{customer.name}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onChangeCustomer}>
          {t("otherCustomer")}
        </Button>
      </div>
      <ContactChooser
        customer={customer}
        contactTypes={contactTypes}
        autoAdvance={autoAdvance}
        initialContactId={who?.customerId === customer.id ? who.contactId : null}
        onDone={({ contact }) =>
          onDone({
            who: {
              customerId: customer.id,
              customerName: customer.name,
              contactId: contact.id,
              contactName: contact.name,
            },
          })
        }
      />
    </div>
  );
}

/**
 * Step 1: the customer (search, recent, or a new one after the duplicate check) and contact. A
 * picked customer goes straight on to step 2 with its default contact; a preselected one waits.
 */
export function WhoStep(props: WhoStepProps) {
  const { recent, customerTypes, contactTypes, flow } = props;
  const { customer, picked, mode, setMode, checking, startNew, choose } = flow;
  const search = () => setMode({ kind: "search" });
  if (customer) {
    return (
      <ChosenCustomer
        {...props}
        customer={customer}
        autoAdvance={picked}
        onChangeCustomer={() => choose({ customer: null })}
      />
    );
  }
  if (mode.kind === "similar") {
    const { name, matches } = mode;
    const onNew = () => setMode({ kind: "new", name, checked: name });
    return <SimilarCustomers name={name} matches={matches} onUse={choose} onNew={onNew} />;
  }
  if (mode.kind === "new") {
    return (
      <NewCustomerForm
        {...{ name: mode.name, checkedName: mode.checked, customerTypes, contactTypes }}
        {...{ onCancel: search, onUse: choose, onCreated: choose }}
      />
    );
  }
  return (
    <CustomerSearch
      {...{ recent, checking, initialQuery: props.search ?? "" }}
      onPick={choose}
      onNew={startNew}
    />
  );
}
