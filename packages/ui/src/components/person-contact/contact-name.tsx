"use client";

import { useState } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card/hover-card";
import { ContactCard } from "./contact-card";

/** Someone to reach: everything their card shows. */
export type NamedContact = {
  id?: string | undefined;
  name: string;
  /** Why this person: a role, a responsibility, the client they work for. */
  description?: string | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  photoUrl?: string | null | undefined;
  /** Off for people outside the organization (a client's contact): they have no profile. */
  avatar?: boolean | undefined;
};

export type ContactNameProps = {
  contact: NamedContact;
  /** The person's page: a click goes there, and the card opens on hover only. */
  href?: string | undefined;
  className?: string;
};

const TRIGGER =
  "max-w-full truncate rounded-sm text-left underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";

/**
 * A person's name. Point at it or click it for their card: why them, phone and email. A click
 * keeps it open on touch, where hover does not exist; a tap outside closes it. With `href` the name
 * is a link: hover shows the card and a click opens the page.
 */
export function ContactName({ contact, href, className }: ContactNameProps) {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {href ? (
          <AppLink href={href} className={cn(TRIGGER, className)}>
            {contact.name}
          </AppLink>
        ) : (
          <button
            type="button"
            data-slot="contact-name"
            onClick={() => setOpen(true)}
            className={cn(TRIGGER, className)}
          >
            {contact.name}
          </button>
        )}
      </HoverCardTrigger>
      <HoverCardContent side="top" collisionPadding={16} className="w-72">
        <ContactCard contact={contact} />
      </HoverCardContent>
    </HoverCard>
  );
}
