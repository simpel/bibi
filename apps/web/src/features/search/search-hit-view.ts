import { itemRoute } from "@/lib/configuration-routes";
import { venueRoute } from "@/lib/routes";

export type SearchHitView = {
  entityType: "venue" | "item";
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

/** The page a hit opens: a venue's page, or an item's page (`/items/[id]`). */
export function hitRoute({ entityType, entityId }: HitRouteInput): string {
  return entityType === "venue" ? venueRoute({ id: entityId }) : itemRoute({ id: entityId });
}
