import type { PageContext } from "@bibi/ai";

export type BuildPageContextInput = { pathname: string; locale: "sv" | "en" };

/** `/sv/<org>/venues/<id>` → `{ type: "venue", id }`. Only detail pages carry an entity. */
const ENTITY_ROUTE = /^\/(?:sv|en)\/[^/?#]+\/(venues|skills)\/([^/?#]+)\/?$/;
const ENTITY_TYPE: Record<string, string> = { venues: "venue", skills: "skill" };
const RESERVED_SEGMENTS = new Set(["new", "import"]);

const decode = ({ value }: { value: string }): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * What the assistant is told about the current page (route, locale, entity when on a detail
 * page). An untrusted hint on the server side, so it only needs to be well-formed here.
 */
export function buildPageContext({ pathname, locale }: BuildPageContextInput): PageContext {
  const match = ENTITY_ROUTE.exec(pathname);
  const type = match?.[1] ? ENTITY_TYPE[match[1]] : undefined;
  const id = match?.[2] ? decode({ value: match[2] }) : undefined;
  const route = pathname.slice(0, 300) || "/";
  if (!type || !id || RESERVED_SEGMENTS.has(id)) return { route, locale };
  return { route, locale, entity: { type, id } };
}
