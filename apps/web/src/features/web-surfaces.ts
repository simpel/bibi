/**
 * Which core operations have a UI surface in the web app. The parity test in `apps/mcp`
 * (and `web-surfaces.test.ts` here) read this list: a new operation must either appear in
 * `WEB_SURFACES` (with the route that exposes it) or be listed in `UI_EXEMPT` with a reason.
 */
export type WebSurface = {
  /** Core operation name, e.g. `venue.create`. */
  operation: string;
  /** Route pattern below `src/app/[locale]/(app)`, e.g. `/venues/[id]`. */
  route: string;
};

export type UiExempt = { operation: string; reason: string };

export const WEB_SURFACES: readonly WebSurface[] = [
  { operation: "venue.list", route: "/venues" },
  { operation: "venue.get", route: "/venues/[id]" },
  { operation: "venue.create", route: "/venues" },
  { operation: "venue.update", route: "/venues/[id]" },
  { operation: "venue.archive", route: "/venues/[id]" },
  { operation: "room.list", route: "/venues/[id]" },
  { operation: "room.get", route: "/venues" },
  { operation: "room.create", route: "/venues/[id]" },
  { operation: "room.update", route: "/venues/[id]" },
  { operation: "room.archive", route: "/venues/[id]" },
  { operation: "search", route: "/venues" },
];

const AI_PHASE_REASON =
  "UI arrives in the AI phase (assistant panel, conversations, skills pages); not built yet.";

const aiPhase = ({ operations }: { operations: readonly string[] }): UiExempt[] =>
  operations.map((operation) => ({ operation, reason: AI_PHASE_REASON }));

/** Operations deliberately without UI. Every entry needs a reason; remove it when UI ships. */
export const UI_EXEMPT: readonly UiExempt[] = aiPhase({
  operations: [
    "conversation.list",
    "conversation.get",
    "conversation.create",
    "conversation.rename",
    "conversation.archive",
    "message.list",
    "message.append",
    "skill.list",
    "skill.get",
    "skill.export",
    "skill.create",
    "skill.update",
    "skill.publish",
    "skill.archive",
    "skill.share",
    "skill.import",
  ],
});
