import type { PipelineProblem } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type ProblemListProps = { ready: boolean; problems: PipelineProblem[] };

/** Where the problem is: phase, item type and state, as far as they are known. */
const placeOf = ({ problem }: { problem: PipelineProblem }) =>
  [problem.phase, problem.type, problem.state].filter(Boolean).join(" · ");

/** The configuration problems in plain words; errors block activation, warnings do not. */
export function ProblemList({ ready, problems }: ProblemListProps) {
  const t = useTranslations("pipelineSetup.preview");
  return (
    <div className="grid gap-2" aria-live="polite">
      <p className="text-sm font-medium">{ready ? t("ready") : t("notReady")}</p>
      {problems.length === 0 ? null : (
        <ul className="grid gap-1 text-sm">
          {problems.map((problem) => (
            <li
              key={`${problem.code}-${placeOf({ problem })}`}
              className="flex flex-wrap items-center gap-2"
            >
              <Badge variant={problem.severity === "error" ? "destructive" : "secondary"}>
                {t(`severity.${problem.severity}`)}
              </Badge>
              <span>{t(`problems.${problem.code}`)}</span>
              {placeOf({ problem }) ? (
                <span className="text-muted-foreground">{placeOf({ problem })}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
