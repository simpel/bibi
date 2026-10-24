import { cellProblems, duplicates, problem, statusProblems, typeProblems } from "./draft-problems";
import type { PipelinePreview } from "./schema";
import { type SimulateInput, simulate } from "./simulate";

/**
 * The guided setup's preview (ADR 0044), pure and without writes: the draft's configuration
 * problems and a simulated ticket stepped through every status. Errors block activation.
 */
export function previewPipeline({ draft, bookable }: SimulateInput): PipelinePreview {
  const typeNames = draft.itemTypes.map((type) => type.name);
  const problems = [
    ...statusProblems({ statuses: draft.statuses }),
    ...duplicates({ names: typeNames }).map((type) =>
      problem({ code: "DUPLICATE_NAME", message: "Two item types share a name", type }),
    ),
    ...draft.itemTypes.flatMap((type) =>
      typeProblems({ draft: type, bookable: bookable.get(type.name) === true }),
    ),
    ...cellProblems({ draft }),
  ];
  const simulated = simulate({ draft, bookable });
  const all = [...problems, ...simulated.problems];
  return {
    ready: !all.some((row) => row.severity === "error"),
    problems: all,
    steps: simulated.steps,
  };
}
