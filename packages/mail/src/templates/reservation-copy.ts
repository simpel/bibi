import { getCatalog, type Locale } from "@bibi/i18n";

export type ReservationMailKind = "confirmation" | "changed" | "cancelled" | "reminder";

type KindCopy = { subject: string; heading: string; intro: string; manageNote: string };

type ReservationCopy = {
  greeting: string;
  date: string;
  time: string;
  party: string;
  partyOne: string;
  partyMany: string;
  name: string;
  note: string;
  contact: string;
  policy: string;
  manageButton: string;
  bookButton: string;
  fallback: string;
  poweredBy: string;
  kinds: Record<ReservationMailKind, KindCopy>;
};

export function getReservationCopy({ locale }: { locale: Locale }): ReservationCopy {
  const catalog = getCatalog({ locale }) as unknown as { email: { reservation: ReservationCopy } };
  return catalog.email.reservation;
}
