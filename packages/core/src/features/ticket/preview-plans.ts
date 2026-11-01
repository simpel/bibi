import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { toTicketTemplateDto, WITH_LINES } from "../ticket-template/load-ticket-template";
import { type GuestRange, lastEnd } from "./plan/plan-groups";
import { planTemplateLines } from "./plan/plan-template-lines";
import type { PlannedLine } from "./plan/planned-line";
import { checkDraftLines } from "./preview-draft-checks";
import type { TicketPreviewLinesInput } from "./preview-lines-schema";
import { checkReadable } from "./ticket-rules";

type Ctx = { context: OperationContext };

/** One entry to preview: a package's planned lines, or the draft's. */
export type PreviewPlan = {
  templateId: string | null;
  range: GuestRange | null;
  lines: PlannedLine[];
  endsAt: Date | null;
};

type TemplatesInput = Ctx & { templateIds: readonly string[]; startsAt: Date };

/** Each package planned from the requested start, in the order asked; one query for all. */
async function templatePlans({
  context,
  templateIds,
  startsAt,
}: TemplatesInput): Promise<Result<PreviewPlan[]>> {
  const readable = checkReadable({ context, permission: "template:read", path: "templateIds" });
  if (!readable.ok) return readable;
  const rows = await context.db.ticketTemplate.findMany({
    where: { id: { in: [...new Set(templateIds)] } },
    include: WITH_LINES,
  });
  const byId = new Map(rows.map((row) => [row.id, toTicketTemplateDto({ row })]));
  const plans: PreviewPlan[] = [];
  for (const id of templateIds) {
    const template = byId.get(id);
    if (!template) return notFound({ entity: "Ticket template" });
    const plan = planTemplateLines({ template, startsAt });
    const range = { minGuests: template.minGuests, maxGuests: template.maxGuests };
    plans.push({ templateId: id, range, lines: plan.lines, endsAt: lastEnd(plan) });
  }
  return ok({ value: plans });
}

export type PreviewPlansInput = Ctx & { input: TicketPreviewLinesInput };

/** The plans to preview: one per package in `templateIds`, or one for the draft `lines`. */
export async function previewPlans({
  context,
  input,
}: PreviewPlansInput): Promise<Result<PreviewPlan[]>> {
  const { templateIds, lines, startsAt, customerId } = input;
  if (Boolean(templateIds) === Boolean(lines)) {
    const message = "Give either templateIds or lines";
    return invalid({ message, issues: [{ path: "templateIds", message }] });
  }
  if (templateIds) return templatePlans({ context, templateIds, startsAt });
  const draft = lines ?? [];
  const checked = await checkDraftLines({ context, lines: draft, customerId });
  if (!checked.ok) return checked;
  const plan = { templateId: null, range: null, lines: draft, endsAt: lastEnd({ lines: draft }) };
  return ok({ value: [plan] });
}
