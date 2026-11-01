import {
  createNumberFormat,
  DEFAULT_CURRENCY,
  DEFAULT_MONEY_FORMAT,
  MONEY_FORMATS,
  type MoneyFormat,
  NUMBER_FORMATS,
  type NumberFormatStyle,
} from "@bibi/core/schemas";
import type { FormatOption } from "./display-format-options";

/** The number select's first option: no own style, the UI language's (stored as `null`). */
export const LANGUAGE_NUMBER_FORMAT = "LANGUAGE";
export type NumberFormatChoice = NumberFormatStyle | typeof LANGUAGE_NUMBER_FORMAT;

const SAMPLE_NUMBER = 1234567.5;
/** 1 012 990 in major units. */
const SAMPLE_MINOR = 101299000;

export type NumberOptionsInput = { locale: string };

/** One option per number format, each rendering the sample number in that format. */
export function numberFormatOptions({ locale }: NumberOptionsInput) {
  const choices: NumberFormatChoice[] = [LANGUAGE_NUMBER_FORMAT, ...NUMBER_FORMATS];
  return choices.map((value): FormatOption<NumberFormatChoice> => {
    const numberFormat = value === LANGUAGE_NUMBER_FORMAT ? null : value;
    const format = createNumberFormat({ locale, formats: { numberFormat, moneyFormat: null } });
    return {
      value,
      example: format.number({ value: SAMPLE_NUMBER }),
      isDefault: value === LANGUAGE_NUMBER_FORMAT,
    };
  });
}

/** One option per money format, each rendering the sample amount (in `DEFAULT_CURRENCY`). */
export function moneyFormatOptions({ locale }: NumberOptionsInput) {
  return MONEY_FORMATS.map((moneyFormat): FormatOption<MoneyFormat> => {
    const format = createNumberFormat({ locale, formats: { numberFormat: null, moneyFormat } });
    return {
      value: moneyFormat,
      example: format.money({ minor: SAMPLE_MINOR, currency: DEFAULT_CURRENCY }),
      isDefault: moneyFormat === DEFAULT_MONEY_FORMAT,
    };
  });
}
