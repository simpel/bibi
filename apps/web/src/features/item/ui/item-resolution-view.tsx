import type { ItemResolution, ResolvedItemNode, ResolvedTag } from "@okazi/core/schemas";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type ItemResolutionViewProps = { resolution: ItemResolution };

type TagListProps = {
  title: string;
  tags: readonly ResolvedTag[];
  /** Item id → name, to show which options carry a "may contain" value. */
  names?: ReadonlyMap<string, string>;
};

function TagList({ title, tags, names }: TagListProps) {
  const t = useTranslations("item.resolution");
  return (
    <div className="grid gap-1">
      <p className="text-sm font-medium">{title}</p>
      {tags.length === 0 ? <p className="text-sm text-muted-foreground">{t("none")}</p> : null}
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge key={tag.valueId} variant={names ? "outline" : "secondary"}>
            {names
              ? t("via", {
                  name: tag.name,
                  items: tag.itemIds.map((id) => names.get(id) ?? "–").join(", "),
                })
              : tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/** Indent per level below the item's own parts (at most 5 levels, ADR 0021). */
const INDENT = ["", "ps-4", "ps-8", "ps-12", "ps-16"];

function PartLine({ node }: { node: ResolvedItemNode }) {
  const t = useTranslations("item.resolution");
  const note = node.choiceGroup
    ? t("option", { group: node.choiceGroup })
    : node.required
      ? null
      : t("optional");
  return (
    <li className={INDENT[node.depth - 1]}>
      {t("part", { quantity: node.quantity, name: node.name })}
      {note ? <span className="text-muted-foreground"> · {note}</span> : null}
    </li>
  );
}

/** A stable key per part: its path, plus a counter when a parent has the same part twice. */
function keyed({ nodes }: { nodes: readonly ResolvedItemNode[] }) {
  const seen = new Map<string, number>();
  return nodes.map((node) => {
    const path = node.path.join("/");
    const count = (seen.get(path) ?? 0) + 1;
    seen.set(path, count);
    return { node, key: `${path}#${count}` };
  });
}

/** What an item contains (from `item.resolve`): inherited list values and the expanded parts. */
export function ItemResolutionView({ resolution }: ItemResolutionViewProps) {
  const t = useTranslations("item.resolution");
  const names = new Map(resolution.nodes.map((node) => [node.itemId, node.name]));
  const parts = keyed({ nodes: resolution.nodes.filter((node) => node.depth > 0) });
  return (
    <div className="grid gap-3">
      <TagList title={t("contains")} tags={resolution.contains} />
      <TagList title={t("mayContain")} tags={resolution.mayContain} names={names} />
      {parts.length > 0 ? (
        <div className="grid gap-1">
          <p className="text-sm font-medium">{t("parts")}</p>
          <ul className="grid gap-0.5 text-sm">
            {parts.map(({ node, key }) => (
              <PartLine key={key} node={node} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
