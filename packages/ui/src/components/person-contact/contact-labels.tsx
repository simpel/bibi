"use client";

import { createContext, type ReactNode, useContext } from "react";

/** The words a person's contact card writes, from the app's translations. */
export type ContactLabels = {
  phone: string;
  email: string;
  /** A row's copy button: "Copy phone". */
  copy: (input: { label: string }) => string;
  /** The toast after copying: "Phone copied". */
  copied: (input: { label: string }) => string;
  copyFailed: string;
};

const ContactLabelsContext = createContext<ContactLabels | null>(null);

export function ContactLabelsProvider({
  labels,
  children,
}: {
  labels: ContactLabels;
  children: ReactNode;
}) {
  return <ContactLabelsContext value={labels}>{children}</ContactLabelsContext>;
}

/** The contact card's words; the app wraps every page in `ContactLabelsProvider`. */
export function useContactLabels(): ContactLabels {
  const labels = useContext(ContactLabelsContext);
  if (!labels) throw new Error("useContactLabels needs a ContactLabelsProvider");
  return labels;
}
