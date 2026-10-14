export type SearchHitView = {
  entityType: "venue" | "room";
  entityId: string;
  /** Venue to navigate to (the entity itself for venues, the parent for rooms). */
  venueId: string;
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
