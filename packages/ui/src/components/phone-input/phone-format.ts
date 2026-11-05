/**
 * Phone number cleaning, auto-formatting, caret tracking, and input key validation.
 */

export type CleanPhoneInput = { value: string };

/**
 * Extracts only valid phone characters: leading `+` (if present) and digits 0–9.
 * Strips letters, spaces, hyphens, parentheses, and any other symbols.
 */
export function cleanPhoneDigits({ value }: CleanPhoneInput): string {
  const trimmed = value.trim();
  const plusIdx = trimmed.indexOf("+");
  const firstDigitIdx = trimmed.search(/\d/);
  const hasLeadingPlus = plusIdx !== -1 && (firstDigitIdx === -1 || plusIdx < firstDigitIdx);
  const digits = value.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digits}` : digits;
}

export type FormatPhoneInput = { value: string };

/** Swedish 3-digit area codes for major cities. */
const SWEDISH_THREE_DIGIT_AREAS = new Set([
  "011",
  "013",
  "018",
  "019",
  "021",
  "023",
  "026",
  "031",
  "033",
  "035",
  "036",
  "040",
  "042",
  "044",
  "046",
  "054",
  "060",
  "063",
  "090",
]);

/**
 * Formats Swedish mobile or national phone numbers.
 * Examples: `070-123 45 67`, `08-123 45 67`, `031-123 45 67`, `0176-123 45`.
 */
function formatSwedishNational({ digits }: { digits: string }): string {
  if (digits.length <= 1) return digits;

  // Stockholm 08 (2 digits)
  if (digits.startsWith("08")) {
    const area = "08";
    const rest = digits.slice(2);
    if (!rest) return area;
    if (rest.length <= 3) return `${area}-${rest}`;
    if (rest.length <= 5) return `${area}-${rest.slice(0, 3)} ${rest.slice(3)}`;
    const main = `${area}-${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)}`;
    return rest.length > 7 ? `${main} ${rest.slice(7)}`.trim() : main.trim();
  }

  // All 07x numbers in Sweden are mobile / personal numbers with 3-digit area code
  const isMobile = digits.startsWith("07");
  const isThreeDigitArea = SWEDISH_THREE_DIGIT_AREAS.has(digits.slice(0, 3));

  if (isMobile || isThreeDigitArea || digits.length < 4) {
    if (digits.length <= 3) return digits;
    const area = digits.slice(0, 3);
    const rest = digits.slice(3);
    if (!rest) return area;
    if (rest.length <= 3) return `${area}-${rest}`;
    if (rest.length <= 5) return `${area}-${rest.slice(0, 3)} ${rest.slice(3)}`;
    const main = `${area}-${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)}`;
    return rest.length > 7 ? `${main} ${rest.slice(7)}`.trim() : main.trim();
  }

  // 4-digit area code (e.g. 0176, 0498, 0980...)
  const area = digits.slice(0, 4);
  const rest = digits.slice(4);
  if (!rest) return area;
  if (rest.length <= 2) return `${area}-${rest}`;
  if (rest.length <= 4) return `${area}-${rest.slice(0, 2)} ${rest.slice(2)}`;
  const main = `${area}-${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)}`;
  return rest.length > 6 ? `${main} ${rest.slice(6)}`.trim() : main.trim();
}

/**
 * Formats Swedish international phone numbers starting with `+46`.
 * Example: `+46 70 123 45 67` or `+46 8 123 45 67`.
 */
function formatSwedishInternational({ digits }: { digits: string }): string {
  const rest = digits.slice(3); // after '+46'
  if (!rest) return "+46";

  // Stockholm (+46 8)
  if (rest.startsWith("8")) {
    if (rest.length <= 1) return `+46 8`;
    if (rest.length <= 4) return `+46 8 ${rest.slice(1)}`;
    if (rest.length <= 6) return `+46 8 ${rest.slice(1, 4)} ${rest.slice(4)}`;
    const main = `+46 8 ${rest.slice(1, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 8)}`;
    return rest.length > 8 ? `${main} ${rest.slice(8)}`.trim() : main.trim();
  }

  // Mobile or other area code (2-digit area: 70, 72, 73, 76, 79, 31, etc.)
  if (rest.length <= 2) return `+46 ${rest}`;
  if (rest.length <= 5) return `+46 ${rest.slice(0, 2)} ${rest.slice(2)}`;
  if (rest.length <= 7) return `+46 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  const main = `+46 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
  return rest.length > 9 ? `${main} ${rest.slice(9)}`.trim() : main.trim();
}

/**
 * Formats US/Canada international numbers (+1).
 * Example: `+1 (555) 123-4567`.
 */
function formatNorthAmerican({ digits }: { digits: string }): string {
  const rest = digits.slice(2);
  if (!rest) return "+1";
  if (rest.length <= 3) return `+1 ${rest}`;
  if (rest.length <= 6) return `+1 (${rest.slice(0, 3)}) ${rest.slice(3)}`;
  const main = `+1 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 10)}`;
  return rest.length > 10 ? `${main} ${rest.slice(10)}`.trim() : main.trim();
}

/**
 * General international phone number formatting (ITU-T E.123 standard).
 * Groups remaining digits in readable chunks of 3 and 2.
 */
function formatGenericInternational({ digits }: { digits: string }): string {
  let ccLength = 3; // default 2-digit CC (+XX)
  if (digits.startsWith("+1") || digits.startsWith("+7")) {
    ccLength = 2;
  } else if (
    /^\+(?:35\d|37\d|38\d|42\d|50\d|59\d|67\d|68\d|85\d|88\d|96\d|97\d|99\d)/.test(digits)
  ) {
    ccLength = 4; // 3-digit CC (+XXX)
  }

  const cc = digits.slice(0, ccLength);
  const rest = digits.slice(ccLength);
  if (!rest) return cc;

  const chunks: string[] = [];
  let remaining = rest;
  while (remaining.length > 4) {
    chunks.push(remaining.slice(0, 3));
    remaining = remaining.slice(3);
  }
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  return `${cc} ${chunks.join(" ")}`;
}

/**
 * Auto-formats a phone number as the user types.
 * Supports Swedish national (`070-123 45 67`), Swedish international (`+46 70 123 45 67`),
 * North American (`+1 (555) 123-4567`), and general international numbers.
 */
export function formatPhoneNumber({ value }: FormatPhoneInput): string {
  const clean = cleanPhoneDigits({ value });
  if (!clean) return "";
  if (clean === "+") return "+";

  if (clean.startsWith("+")) {
    if (clean.startsWith("+46")) return formatSwedishInternational({ digits: clean });
    if (clean.startsWith("+1")) return formatNorthAmerican({ digits: clean });
    return formatGenericInternational({ digits: clean });
  }

  if (clean.startsWith("0")) {
    return formatSwedishNational({ digits: clean });
  }

  // If user typed '4670...' without '+', treat as Swedish international
  if (clean.startsWith("46") && clean.length >= 4) {
    return formatSwedishInternational({ digits: `+${clean}` });
  }

  // Generic digits fallback: chunk into readable 3-3-4 blocks
  const chunks: string[] = [];
  let remaining = clean;
  while (remaining.length > 4) {
    chunks.push(remaining.slice(0, 3));
    remaining = remaining.slice(3);
  }
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  return chunks.join(" ");
}

export type CaretInput = {
  rawCountBeforeCaret: number;
  nextFormatted: string;
};

/**
 * Calculates the next caret position in `nextFormatted` based on how many
 * raw phone characters were typed/selected before the cursor.
 */
export function calculateCaretPosition({ rawCountBeforeCaret, nextFormatted }: CaretInput): number {
  if (rawCountBeforeCaret <= 0) {
    return nextFormatted.startsWith("+") ? 1 : 0;
  }

  let seenRaw = 0;
  let targetIndex = nextFormatted.length;

  for (let i = 0; i < nextFormatted.length; i++) {
    const ch = nextFormatted[i];
    if (ch && (ch === "+" || (ch >= "0" && ch <= "9"))) {
      seenRaw++;
      if (seenRaw === rawCountBeforeCaret) {
        targetIndex = i + 1;
        break;
      }
    }
  }

  // Advance past immediate formatting delimiters (space, hyphen, closing paren)
  while (
    targetIndex < nextFormatted.length &&
    (nextFormatted[targetIndex] === " " ||
      nextFormatted[targetIndex] === "-" ||
      nextFormatted[targetIndex] === ")")
  ) {
    targetIndex++;
  }

  return targetIndex;
}

/**
 * Counts the number of raw phone characters (+ or 0-9) up to `index` in `text`.
 */
export function countRawCharsBefore({ text, index }: { text: string; index: number }): number {
  let count = 0;
  const limit = Math.min(index, text.length);
  for (let i = 0; i < limit; i++) {
    const ch = text[i];
    if (ch && (ch === "+" || (ch >= "0" && ch <= "9"))) {
      count++;
    }
  }
  return count;
}

export type BackspaceInput = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export type BackspaceResult = {
  nextValue: string;
  nextCaret: number;
};

/**
 * When backspacing right after a separator character like ' ' or '-', delete the
 * digit before the separator so the user never gets stuck.
 */
export function handlePhoneBackspace({
  value,
  selectionStart,
  selectionEnd,
}: BackspaceInput): BackspaceResult | null {
  if (selectionStart !== selectionEnd || selectionStart <= 0) {
    return null;
  }

  const charBefore = value[selectionStart - 1];
  const isSeparator =
    charBefore === " " || charBefore === "-" || charBefore === ")" || charBefore === "(";

  if (!isSeparator) {
    return null;
  }

  // Find the last digit or '+' before selectionStart
  let digitIndex = -1;
  for (let i = selectionStart - 1; i >= 0; i--) {
    const ch = value[i];
    if (ch && (ch === "+" || (ch >= "0" && ch <= "9"))) {
      digitIndex = i;
      break;
    }
  }

  if (digitIndex === -1) {
    return null;
  }

  const rawBefore = value.slice(0, digitIndex) + value.slice(digitIndex + 1);
  const nextFormatted = formatPhoneNumber({ value: rawBefore });
  const rawCount = countRawCharsBefore({ text: value, index: digitIndex });
  const nextCaret = calculateCaretPosition({
    rawCountBeforeCaret: rawCount,
    nextFormatted,
  });

  return { nextValue: nextFormatted, nextCaret };
}

export type KeyAllowedInput = {
  key: string;
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  ctrlOrMeta: boolean;
};

/**
 * Validates whether a keypress should be allowed in the phone input.
 * Only digits 0–9, a leading '+', and control/navigation keys are permitted.
 */
export function isAllowedPhoneKey({
  key,
  value,
  selectionStart,
  selectionEnd,
  ctrlOrMeta,
}: KeyAllowedInput): boolean {
  if (ctrlOrMeta) return true;

  const navigationKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Tab",
    "Enter",
    "Escape",
  ];
  if (navigationKeys.includes(key)) return true;

  if (key >= "0" && key <= "9") return true;

  if (key === "+") {
    const atStart = selectionStart === 0;
    const allSelected = selectionStart === 0 && selectionEnd === value.length;
    const hasPlus = value.includes("+");
    return (atStart && !hasPlus) || allSelected;
  }

  return false;
}
