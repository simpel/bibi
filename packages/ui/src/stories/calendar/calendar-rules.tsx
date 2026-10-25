import { PRINCIPLES, USAGE } from "./calendar-rules-data";

function Principles() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {PRINCIPLES.map((principle, index) => (
        <li key={principle.title} className="rounded-xl border bg-card p-4 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground tabular-nums">{index + 1}</p>
          <p className="font-medium">{principle.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{principle.body}</p>
        </li>
      ))}
    </ol>
  );
}

function UsageMatrix() {
  const head = "px-3 py-2 text-xs font-medium text-muted-foreground";
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
      <div className="grid min-w-[44rem] grid-cols-[8rem_12rem_1fr_1fr]">
        <span className={head}>Component</span>
        <span className={head}>Answers</span>
        <span className={head}>Internal (staff)</span>
        <span className={head}>External (customer)</span>
        {USAGE.map((row) => (
          <div key={row.component} className="contents text-sm">
            <span className="border-t px-3 py-3 font-medium">{row.component}</span>
            <span className="border-t px-3 py-3">{row.question}</span>
            <span className="border-t px-3 py-3 text-muted-foreground">{row.internal}</span>
            <span className="border-t px-3 py-3 text-muted-foreground">{row.external}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The calendar design language: principles first, then which component goes where. */
export function CalendarRules() {
  return (
    <div className="grid max-w-5xl gap-8 font-sans">
      <div>
        <h2 className="font-serif text-3xl font-light text-black dark:text-white">
          Calendar language
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Five components, one set of marks, one way to show people. Choose by the question the
          reader is asking, then set the audience. The marks, buffers and axis rules are shared, so
          a booking reads the same on the ticket, in the main calendar and on the customer's payment
          page.
        </p>
      </div>
      <Principles />
      <UsageMatrix />
    </div>
  );
}
