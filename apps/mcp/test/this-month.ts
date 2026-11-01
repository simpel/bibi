/** This calendar month in UTC, around real time: the dashboard's default range (ADR 0086). */
export function thisMonth(): { from: string; to: string } {
  const today = new Date().toISOString().slice(0, 10);
  const last = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0));
  return { from: `${today.slice(0, 7)}-01`, to: last.toISOString().slice(0, 10) };
}
