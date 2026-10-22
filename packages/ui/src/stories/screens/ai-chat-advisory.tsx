import { AlertCircleIcon, CalendarIcon, DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import { Button } from "../../components/button/button";

export function AIChatAdvisory() {
  return (
    <>
      {/* Operational Advisory Callout */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircleIcon className="size-4 text-amber-600 dark:text-amber-400" />
          <span>Catering & Service Buffer Advisory for Week 46</span>
        </div>
        <p className="mt-1 leading-relaxed text-muted-foreground dark:text-amber-300/80">
          Total dinner covers for Saturday, Nov 21 will exceed <strong>420 guests</strong>. Per
          estate guidelines, kitchen prep requires locking dietary confirmations by{" "}
          <strong>Nov 13</strong> and scheduling <strong>+2 back-of-house culinary hands</strong>.
        </p>
      </div>

      {/* Interactive Follow-up Action Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <FileSpreadsheetIcon className="size-3.5 text-primary" />
          <span>Generate Kitchen Staffing Runsheet</span>
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <CalendarIcon className="size-3.5" />
          <span>Check Orangeriet Turnover Buffer</span>
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground">
          <DownloadIcon className="size-3.5" />
          <span>Export Report</span>
        </Button>
      </div>
    </>
  );
}
