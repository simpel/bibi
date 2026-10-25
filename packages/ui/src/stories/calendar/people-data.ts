import type { CalendarPerson } from "../../components/availability-calendar/calendar-types";

/** Lindholmen demo staff. Johan, Erik and Ali are seeded members; Sara, Mona and Leo are staff items. */
export const PEOPLE = {
  johan: { id: "johan", name: "Johan Ek", role: "Coordinator", phone: "+46 70 555 01 12" },
  erik: { id: "erik", name: "Erik Lund", role: "Sales", phone: "+46 70 555 01 34" },
  ali: { id: "ali", name: "Ali Karimi", role: "Head of kitchen", phone: "+46 70 555 01 56" },
  sara: { id: "sara", name: "Sara Nilsson", role: "AV technician", phone: "+46 70 555 01 78" },
  mona: { id: "mona", name: "Mona Berg", role: "Waiter" },
  leo: { id: "leo", name: "Leo Persson", role: "Waiter" },
} satisfies Record<string, CalendarPerson>;
