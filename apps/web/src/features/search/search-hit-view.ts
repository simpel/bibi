import { itemRoute } from "@/lib/configuration-routes";
import { customerRoute, venueRoute } from "@/lib/routes";

export type SearchHitView = {
  entityType: "venue" | "item" | "customer";
  entityId: string;
  title: string;
  snippet: string;
  score: number;
};

export type SplitContentInput = { content: string };

/** First line of the indexed text is the entity name; the rest is the snippet. */
export function splitContent({ content }: SplitContentInput): { title: string; snippet: string } {
  const [title = "", ...rest] = content.split("\n");
  return { title, snippet: rest.join(" · ").slice(0, 160) };
}

export type HitRouteInput = Pick<SearchHitView, "entityType" | "entityId">;

/** The page a hit opens: the venue's, the item's (`/items/[id]`) or the customer's page. */
export function hitRoute({ entityType, entityId }: HitRouteInput): string {
  if (entityType === "venue") return venueRoute({ id: entityId });
  if (entityType === "customer") return customerRoute({ id: entityId });
  return itemRoute({ id: entityId });
}
