import type { FormFields } from "../inbound-message/schema";
import type { ModelDraft } from "./model-draft-schema";

/**
 * Which form field feeds which draft field (ADR 0085 decision 6). Endpoints do not carry their
 * own mapping yet, so every endpoint uses these names; a per-endpoint mapping replaces this
 * constant when web forms are built (ADR 0085 decision 9).
 */
export const FORM_FIELD_NAMES = {
  senderName: ["name"],
  company: ["company"],
  email: ["email"],
  phone: ["phone"],
  date: ["date"],
  start: ["start", "from"],
  end: ["end", "to"],
  headcount: ["guests", "headcount"],
} as const;

type Key = keyof typeof FORM_FIELD_NAMES;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const given = ({ value }: { value: string }) => ({ quote: value, guessed: false });

function read({ fields, key }: { fields: FormFields; key: Key }): string | null {
  for (const name of FORM_FIELD_NAMES[key]) {
    const value = fields[name];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

type Overlay = Partial<ModelDraft>;

function timesOf({ fields }: { fields: FormFields }): Overlay {
  const overlay: Overlay = {};
  for (const key of ["start", "end"] as const) {
    const value = read({ fields, key });
    if (value && TIME.test(value))
      overlay[key] = { asWritten: value, time: value, ...given({ value }) };
  }
  const date = read({ fields, key: "date" });
  const parts = date ? DATE.exec(date) : null;
  if (date && parts) {
    const [year, month, day] = parts.slice(1).map(Number);
    overlay.date = {
      asWritten: date,
      year: year ?? null,
      month: month ?? 1,
      day: day ?? 1,
      ...given({ value: date }),
    };
  }
  const guests = Number(read({ fields, key: "headcount" }));
  if (Number.isInteger(guests) && guests > 0) {
    overlay.headcount = { value: guests, ...given({ value: String(guests) }) };
  }
  return overlay;
}

/**
 * The draft fields a message's form fields state: taken as given, quoted from the field and never
 * guessed. A value that does not parse is left to the model.
 */
export function formFieldDraft({ fields }: { fields: FormFields | null }): Overlay {
  if (!fields) return {};
  const overlay = timesOf({ fields });
  for (const key of ["senderName", "company", "email", "phone"] as const) {
    const value = read({ fields, key });
    if (value) overlay[key] = { value, ...given({ value }) };
  }
  return overlay;
}
