/**
 * Legal-form words left out when customer names are compared (ADR 0081), as word sequences of
 * a normalised name (`ek. för.` becomes `ek för`). Matched at the start or the end of a name.
 */
const LEGAL_FORMS: readonly (readonly string[])[] = [
  ["ab"],
  ["aktiebolag"],
  ["hb"],
  ["handelsbolag"],
  ["kb"],
  ["kommanditbolag"],
  ["ek", "för"],
  ["ekonomisk", "förening"],
  ["ltd"],
  ["limited"],
  ["inc"],
  ["llc"],
  ["gmbh"],
  ["oy"],
  ["as"],
  ["asa"],
  ["aps"],
  ["plc"],
  ["bv"],
  ["sa"],
];

export type NormaliseNameInput = { name: string };

/** Lowercase words of a name: punctuation is a space, letters keep their diacritics (å, ä, ö). */
export function nameWords({ name }: NormaliseNameInput): string[] {
  return name
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

type WordsInput = { words: readonly string[]; form: readonly string[] };

const startsWith = ({ words, form }: WordsInput) => form.every((word, i) => words[i] === word);
const endsWith = ({ words, form }: WordsInput) =>
  form.every((word, i) => words[words.length - form.length + i] === word);

/** Strips legal forms at either end, repeatedly, but never the last remaining word. */
function stripLegalForms({ words }: { words: string[] }): string[] {
  let rest = words;
  for (let changed = true; changed; ) {
    changed = false;
    for (const form of LEGAL_FORMS) {
      if (rest.length <= form.length) continue;
      if (endsWith({ words: rest, form })) rest = rest.slice(0, rest.length - form.length);
      else if (startsWith({ words: rest, form })) rest = rest.slice(form.length);
      else continue;
      changed = true;
    }
  }
  return rest;
}

/** The name compared for duplicates: case and punctuation folded, legal forms stripped. */
export function normaliseCustomerName({ name }: NormaliseNameInput): string {
  return stripLegalForms({ words: nameWords({ name }) }).join(" ");
}

export type NamesMatchInput = { a: string; b: string };

/** Equal normalised names, or one is a whole-word part of the other (at least 3 letters). */
export function namesMatch({ a, b }: NamesMatchInput): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.length >= 3 && ` ${long} `.includes(` ${short} `);
}
