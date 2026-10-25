import {
  CURRENCY_DISPLAYS,
  type CurrencyDisplay,
  createNumberFormat,
  DEFAULT_CURRENCY,
  NUMBER_FORMATS,
  type NumberFormatStyle,
} from "@bibi/core/schemas";
import type { FormatOption } from "./display-format-options";

/** The number select's first option: no own style, the UI language's (stored as `null`). */
export const LANGUAGE_NUMBER_FORMAT = "LANGUAGE";
export type NumberFormatChoice = NumberFormatStyle | typeof LANGUAGE_NUMBER_FORMAT;

/** The default currency display; picking it stores `null` (ADR 0051). */
export const DEFAULT_CURRENCY_DISPLAY: CurrencyDisplay = "SYMBOL";

const SAMPLE_NUMBER = 1234567.5;
/** 1 234 567,50 in major units. */
const SAMPLE_MINOR = 123456750;

export type NumberOptionsInput = { locale: string };

/** One option per number format, each rendering the sample number in that format. */
export function numberFormatOptions({ locale }: NumberOptionsInput) {
  const choices: NumberFormatChoice[] = [LANGUAGE_NUMBER_FORMAT, ...NUMBER_FORMATS];
  return choices.map((value): FormatOption<NumberFormatChoice> => {
    const numberFormat = value === LANGUAGE_NUMBER_FORMAT ? null : value;
    const format = createNumberFormat({ locale, formats: { numberFormat, currencyDisplay: null } });
    return {
      value,
      example: format.number({ value: SAMPLE_NUMBER }),
      isDefault: value === LANGUAGE_NUMBER_FORMAT,
    };
  });
}

/** One option per currency display, each rendering the sample amount (in `DEFAULT_CURRENCY`). */
export function currencyDisplayOptions({ locale }: NumberOptionsInput) {
  return CURRENCY_DISPLAYS.map((currencyDisplay): FormatOption<CurrencyDisplay> => {
    const format = createNumberFormat({
      locale,
      formats: { numberFormat: null, currencyDisplay },
    });
    return {
      value: currencyDisplay,
      example: format.money({ minor: SAMPLE_MINOR, currency: DEFAULT_CURRENCY }),
      isDefault: currencyDisplay === DEFAULT_CURRENCY_DISPLAY,
    };
  });
}
