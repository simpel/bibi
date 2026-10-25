import { type BusyRow, C } from "./busy-row";

/** Staff and equipment: long shifts, an evening crew and a double-booked projector. */
export const OTHER_ROWS: readonly BusyRow[] = [
  { a: "sara", t: 18, c: C.hisingen, n: "AV technician", s: "08:15", e: "09:30", st: "prebooked" },
  { a: "sara", t: 19, c: C.chalmers, n: "AV technician", s: "09:45", e: "15:30", st: "booked" },
  { a: "omar", t: 50, c: C.massan, n: "AV technician", s: "07:00", e: "13:00", st: "booked" },
  { a: "omar", t: 48, c: C.massan, n: "AV technician", s: "17:30", e: "21:00", st: "prebooked" },
  { a: "mona", t: 18, c: C.hisingen, n: "Waiter", s: "12:00", e: "14:00", st: "estimated" },
  { a: "mona", t: 49, c: C.vgr, n: "Waiter", s: "18:00", e: "23:00", st: "booked" },
  { a: "leo", t: 47, c: C.volvo, n: "Waiter", s: "11:00", e: "13:00", st: "booked" },
  { a: "leo", t: 49, c: C.vgr, n: "Waiter", s: "18:00", e: "23:00", st: "booked" },
  { a: "ali", t: 49, c: C.vgr, n: "Head of kitchen", s: "15:00", e: "23:00", st: "booked" },
  { a: "nora", t: 50, c: C.massan, n: "Host", s: "08:30", e: "17:00", st: "booked" },
  { a: "elin", t: 41, c: C.sca, n: "Guide", s: "13:00", e: "14:30", st: "ordered" },
  { a: "jonas", t: 48, c: C.massan, n: "Bartender", s: "17:00", e: "21:30", st: "prebooked" },
  // Clash 3: one projector, two hard holds 10:00–12:00.
  { a: "projector-1", t: 21, c: C.volvo, n: "Projector", s: "08:00", e: "12:00", st: "booked" },
  {
    a: "projector-1",
    t: 26,
    c: C.hisingen,
    n: "Projector",
    s: "10:00",
    e: "15:00",
    st: "booked",
    no: "Double-booked with Ticket 21 until 12:00.",
  },
  {
    a: "projector-2",
    t: 18,
    c: C.hisingen,
    n: "Projector",
    s: "09:00",
    e: "17:00",
    st: "prebooked",
  },
  { a: "pa", t: 50, c: C.massan, n: "Mobile PA", s: "09:00", e: "20:00", st: "booked" },
  { a: "hybrid", t: 33, c: C.vgr, n: "Hybrid kit", s: "11:00", e: "14:00", st: "prebooked" },
  { a: "riser", t: 48, c: C.massan, n: "Stage riser", s: "17:00", e: "21:00", st: "prebooked" },
  { a: "coffee-cart", t: 41, c: C.sca, n: "Coffee", s: "10:00", e: "10:30", st: "ordered" },
  { a: "coffee-cart", t: 45, c: C.vgr, n: "Coffee", s: "14:30", e: "15:00", st: "estimated" },
];
