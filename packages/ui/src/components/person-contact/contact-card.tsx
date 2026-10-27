import { MailIcon, PhoneIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Avatar } from "../avatar/avatar";
import { type ContactLabels, useContactLabels } from "./contact-labels";
import type { NamedContact } from "./contact-name";
import { CopyValueButton } from "./copy-value-button";

type Way = {
  href: string;
  label: string;
  value: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type WaysInput = Pick<NamedContact, "phone" | "email"> & { labels: ContactLabels };

function waysToReach({ phone, email, labels }: WaysInput): Way[] {
  const ways: Way[] = [];
  if (phone) {
    const href = `tel:${phone.replace(/\s/g, "")}`;
    ways.push({ href, label: labels.phone, value: phone, Icon: PhoneIcon });
  }
  if (email)
    ways.push({ href: `mailto:${email}`, label: labels.email, value: email, Icon: MailIcon });
  return ways;
}

/** Round buttons under the name, one per way to reach them, like a phone's contact card. */
function Actions({ ways }: { ways: Way[] }) {
  return (
    <div className="flex justify-center gap-3">
      {ways.map(({ href, label, value, Icon }) => (
        <a
          key={href}
          href={href}
          aria-label={`${label} ${value}`}
          title={value}
          className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="size-4" aria-hidden />
        </a>
      ))}
    </div>
  );
}

/** The numbers and addresses themselves, one per row under its label, copy at the end. */
function List({ ways }: { ways: Way[] }) {
  return (
    <ul className="grid grid-cols-1 divide-y rounded-lg bg-muted/60">
      {ways.map(({ href, label, value }) => (
        <li key={href} className="flex min-w-0 items-center gap-1 pr-1.5">
          <a
            href={href}
            title={value}
            className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="truncate tabular-nums">{value}</span>
            </span>
          </a>
          <CopyValueButton value={value} label={label} />
        </li>
      ))}
    </ul>
  );
}

/** A person's card: who they are and why them, then buttons and a list to reach them. */
export function ContactCard({ contact }: { contact: NamedContact }) {
  const labels = useContactLabels();
  const ways = waysToReach({ ...contact, labels });
  return (
    <div data-slot="contact-card" className="grid min-w-0 grid-cols-1 gap-3 text-sm">
      <div className="grid min-w-0 justify-items-center gap-1 text-center">
        {contact.avatar === false ? null : (
          <Avatar name={contact.name} photoUrl={contact.photoUrl} size="lg" className="mb-1" />
        )}
        <span className="max-w-full truncate text-base font-medium">{contact.name}</span>
        {contact.description ? (
          <span className="max-w-full truncate text-muted-foreground">{contact.description}</span>
        ) : null}
      </div>
      {ways.length > 0 ? <Actions ways={ways} /> : null}
      {ways.length > 0 ? <List ways={ways} /> : null}
    </div>
  );
}
