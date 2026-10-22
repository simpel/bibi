import { SCHEDULE_ITEMS } from "./schedule-data";

export function RunsheetScheduleView() {
  return (
    <div className="flex w-[56rem] max-w-full flex-col gap-6 p-6 font-sans">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-2xl font-light tracking-tight text-black dark:text-white">
          Dagens Körschema
        </h2>
        <p className="text-sm text-muted-foreground">
          Tidpunkter staplas med OpenType tabular-nums för perfekt arkitektonisk vertikal linjering.
        </p>
      </div>

      <div className="flex flex-col divide-y rounded-xl border bg-card shadow-xs">
        {SCHEDULE_ITEMS.map((item) => (
          <div
            key={item.time}
            className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-6">
              <span className="w-28 font-sans text-xs font-semibold tabular-nums text-foreground">
                {item.time}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.location}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
