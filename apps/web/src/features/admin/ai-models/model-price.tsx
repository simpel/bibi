import type { AiModel } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { perMillion } from "./model-options";

export type ModelPriceProps = { model: AiModel | undefined };

/** "In $2.00 · Out $10.00" per million tokens; embeddings only have an input price. */
export function ModelPrice({ model }: ModelPriceProps) {
  const t = useTranslations("admin.aiModels");
  const { number } = useNumberFormat();
  const usd = ({ value }: { value: number }) =>
    `${number({ value, minimumFractionDigits: 2, maximumFractionDigits: 3 })} USD`;
  const input = perMillion({ price: model?.inputPrice ?? null });
  const output = perMillion({ price: model?.outputPrice ?? null });
  if (input === null) return <span className="text-muted-foreground">{t("noPrice")}</span>;
  const text =
    output === null
      ? t("priceIn", { input: usd({ value: input }) })
      : t("priceInOut", { input: usd({ value: input }), output: usd({ value: output }) });
  return <span className="whitespace-nowrap tabular-nums">{text}</span>;
}
