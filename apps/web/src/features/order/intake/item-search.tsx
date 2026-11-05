import { Badge, Button, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { priceText } from "../../item/ui/price-text";
import type { CatalogItem } from "./catalog";
import { type TypeHue, typeHues } from "./type-hue";
import { type LineTone, TONE_CLASS } from "./use-issue-text";
import type { ReviewModel } from "./use-review-model";
import { useSearchAvailability } from "./use-search-availability";

const SHOWN = 20;

export type ItemSearchProps = {
  model: ReviewModel;
  onItem: (input: { item: CatalogItem }) => void;
  onFreeText: () => void;
};

/** Items whose name or type contains the query, in catalog order. */
export function matchItems({ items, query }: { items: CatalogItem[]; query: string }) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return items;
  return items.filter((item) =>
    `${item.name} ${item.typeName}`.toLocaleLowerCase().includes(needle),
  );
}

type ItemRowProps = Pick<ItemSearchProps, "onItem"> & {
  item: CatalogItem;
  hue: TypeHue | undefined;
  tone?: LineTone;
};

function ItemRow({ item, hue, tone, onItem }: ItemRowProps) {
  const t = useTranslations("orderIntake.line");
  const items = useTranslations("item");
  const { money } = useNumberFormat();
  const price = item.priceMinor === null ? null : priceText({ item, money, t: items });
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
        onClick={() => onItem({ item })}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{item.name}</span>
          {item.typeName ? <Badge hue={hue ?? 1}>{item.typeName}</Badge> : null}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {price ? <span className="text-muted-foreground tabular-nums">{price}</span> : null}
          {tone ? <span className={TONE_CLASS[tone]}>{t(`tone.${tone}`)}</span> : null}
        </span>
      </button>
    </li>
  );
}

/**
 * What the line is: a search across every active item of every type, each with its type and its
 * list price and its availability at the order's start, or a free-text line (spec "The line
 * dialog").
 */
export function ItemSearch({ model, onItem, onFreeText }: ItemSearchProps) {
  const t = useTranslations("orderIntake.line");
  const [query, setQuery] = useState("");
  const { items, itemsHidden } = model.data.catalog;
  const shown = matchItems({ items, query }).slice(0, SHOWN);
  const tones = useSearchAvailability({ model, items: shown });
  const hues = useMemo(
    () => typeHues({ typeNames: items.map(({ typeName }) => typeName) }),
    [items],
  );
  return (
    <div className="grid gap-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
      />
      {itemsHidden ? <p className="text-sm text-muted-foreground">{t("itemsHidden")}</p> : null}
      <ul className="grid max-h-80 gap-1 overflow-y-auto">
        {shown.map((item) => (
          <ItemRow
            key={item.id}
            {...{ item, onItem }}
            hue={hues.get(item.typeName)}
            tone={tones.get(item.id)}
          />
        ))}
      </ul>
      {shown.length === 0 && !itemsHidden ? (
        <p className="text-sm text-muted-foreground">{t("noItems")}</p>
      ) : null}
      <Button type="button" variant="outline" className="justify-self-start" onClick={onFreeText}>
        {t("freeText")}
      </Button>
    </div>
  );
}
