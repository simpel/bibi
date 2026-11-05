import { toIsoDate } from "../../time/plain-date";
import { type DraftChoices, matchPackage, matchValue } from "./draft-choices";
import type { DraftSource } from "./draft-source";
import type { ModelDraft, ModelText } from "./model-draft-schema";
import { evidenceOf } from "./quote-check";
import { resolveDay, resolveInstants } from "./resolve-times";
import type { DraftNeed, DraftText, OrderDraft } from "./schema";

/** The draft without what needs the database: the customer and contact (`resolve-party.ts`). */
export type BuiltDraft = Omit<OrderDraft, "customerId" | "contactId">;

type Check = <T extends { quote: string; guessed: boolean }>(input: { field: T }) => T;

/** A model field keeps its quote, and is guessed when the quote is not in the message. */
const checker =
  ({ source }: { source: string }): Check =>
  ({ field }) => ({
    ...field,
    ...evidenceOf({ quote: field.quote, guessed: field.guessed, source }),
  });

const textOf = ({ field }: { field: ModelText | null }): DraftText | null =>
  field ? { value: field.value.trim(), quote: field.quote, guessed: field.guessed } : null;

type TimesInput = { draft: ModelDraft; source: DraftSource; timeZone: string };

function timesOf({ draft, source, timeZone }: TimesInput) {
  const none = { date: null, start: null, end: null };
  if (!draft.date) return none;
  const day = resolveDay({ date: draft.date, reference: source.receivedAt, timeZone });
  if (!day) return none;
  const { start, end } = draft;
  const { startsAt, endsAt } = resolveInstants({ day, start, end, timeZone });
  const { asWritten, quote, guessed } = draft.date;
  const instant = ({ field, value }: { field: typeof start; value: Date | null }) =>
    field && value
      ? { value, asWritten: field.asWritten, quote: field.quote, guessed: field.guessed }
      : null;
  return {
    date: { value: toIsoDate({ date: day }), asWritten, quote, guessed },
    start: instant({ field: start, value: startsAt }),
    end: instant({ field: end, value: endsAt }),
  };
}

function needsOf({ draft, choices }: { draft: ModelDraft; choices: DraftChoices }): DraftNeed[] {
  return draft.needs.map((need) => {
    const value = matchValue({ choices, name: need.value });
    return {
      ...{
        value: value?.name ?? need.value,
        count: need.count,
        vocabularyValueId: value?.id ?? null,
      },
      ...{ quote: need.quote, guessed: need.guessed },
    };
  });
}

export type BuildDraftInput = {
  model: ModelDraft;
  source: DraftSource;
  choices: DraftChoices;
  timeZone: string;
};

/**
 * The draft from the model's text (ADR 0084): fields the message gives as structure replace the
 * model's and are never guessed; every other value is guessed when its quote is not in the
 * message. Times are resolved here, and the package and needs only from the passed choices.
 */
export function buildDraft({ model, source, choices, timeZone }: BuildDraftInput): BuiltDraft {
  const check = checker({ source: `${source.subject ?? ""}\n${source.text}` });
  const keep = new Set(Object.keys(source.given));
  const checked = <T extends { quote: string; guessed: boolean }>({
    key,
    field,
  }: {
    key: string;
    field: T | null;
  }) => (field && !keep.has(key) ? check({ field }) : field);
  const draft: ModelDraft = { ...model, ...source.given };
  const times = timesOf({ draft, source, timeZone });
  const pkg = draft.packageName ? matchPackage({ choices, name: draft.packageName.value }) : null;
  return {
    sender: checked({ key: "senderName", field: textOf({ field: draft.senderName }) }),
    company: checked({ key: "company", field: textOf({ field: draft.company }) }),
    email: checked({ key: "email", field: textOf({ field: draft.email }) }),
    phone: checked({ key: "phone", field: textOf({ field: draft.phone }) }),
    date: checked({ key: "date", field: times.date }),
    start: checked({ key: "start", field: times.start }),
    end: checked({ key: "end", field: times.end }),
    headcount: checked({ key: "headcount", field: draft.headcount }),
    wish: checked({ key: "wish", field: textOf({ field: draft.wish }) }),
    package:
      pkg && draft.packageName ? check({ field: { ...draft.packageName, value: pkg.name } }) : null,
    needs: needsOf({ draft, choices }).map((field) => check({ field })),
    notes: checked({ key: "notes", field: textOf({ field: draft.notes }) }),
    templateId: pkg?.id ?? null,
    inboundMessageId: source.inboundMessageId,
    timeZone,
  };
}
