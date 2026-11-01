-- Money format: its own setting with the digit grouping and the currency place (expand step,
-- ADR 0013). "currencyDisplay" stays until a later release no longer reads it.
CREATE TYPE "MoneyFormat" AS ENUM ('CODE_COMMA', 'COMMA_SYMBOL', 'SPACE_SYMBOL', 'SPACE_CODE');

ALTER TABLE "UserSettings" ADD COLUMN "moneyFormat" "MoneyFormat";

-- Keep what each user saw as closely as the four formats allow; no choice stays null.
UPDATE "UserSettings"
SET "moneyFormat" = CASE
  WHEN "currencyDisplay" = 'CODE' AND "numberFormat" IN ('COMMA_DOT', 'DOT_COMMA') THEN 'CODE_COMMA'
  WHEN "currencyDisplay" = 'CODE' THEN 'SPACE_CODE'
  WHEN "numberFormat" IN ('COMMA_DOT', 'DOT_COMMA') THEN 'COMMA_SYMBOL'
  WHEN "currencyDisplay" IS NOT NULL OR "numberFormat" IS NOT NULL THEN 'SPACE_SYMBOL'
  ELSE NULL
END::"MoneyFormat";
