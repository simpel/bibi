"use client";

import { useState } from "react";
import { cn } from "../../lib/cn";
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

export type ContactNameProps = { contact: NamedContact; className?: string };

/**
 * A person's name. Point at it or click it for their card: why them, phone and email. A click
 * keeps it open on touch, where hover does not exist; a tap outside closes it.
 */
export function ContactName({ contact, className }: ContactNameProps) {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          data-slot="contact-name"
          onClick={() => setOpen(true)}
          className={cn(
            "max-w-full truncate rounded-sm text-left underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {contact.name}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" collisionPadding={16} className="w-72">
        <ContactCard contact={contact} />
      </HoverCardContent>
    </HoverCard>
  );
}
