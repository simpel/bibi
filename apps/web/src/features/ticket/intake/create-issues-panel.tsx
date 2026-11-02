import type { AppErrorIssue } from "@bibi/core";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { DraftLine } from "./draft-line";

export type CreateIssuesPanelProps = {
  issues: AppErrorIssue[];
  lines: DraftLine[];
  onEditLine: (input: { line: DraftLine }) => void;
};

/** The draft line an issue path names (`lines.1.options` → the second line), else null. */
const lineOf = ({ path, lines }: { path: string; lines: DraftLine[] }) => {
  const match = /^lines\.(\d+)(\.|$)/.exec(path);
  return match ? (lines[Number(match[1])] ?? null) : null;
};

const unique = ({ issues }: { issues: AppErrorIssue[] }) =>
  issues.filter(
    (issue, index) =>
      issues.findIndex(({ path, message }) => path === issue.path && message === issue.message) ===
      index,
  );

/**
 * What stops Create that no field can show (spec "Create"): a line's issue names the line with
 * Edit line, any other issue its message.
 */
export function CreateIssuesPanel({ issues, lines, onEditLine }: CreateIssuesPanelProps) {
  const t = useTranslations("ticketIntake.create");
  if (issues.length === 0) return null;
  return (
    <section
      role="alert"
      className="grid gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
    >
      <h3 className="font-medium">{t("issuesTitle")}</h3>
      <ul className="grid gap-2">
        {unique({ issues }).map(({ path, message }) => {
          const line = lineOf({ path, lines });
          return (
            <li key={`${path}-${message}`} className="flex flex-wrap items-center gap-2">
              <span>{line ? t("lineIssue", { line: line.name, message }) : message}</span>
              {line ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditLine({ line })}
                >
                  {t("editLine")}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
