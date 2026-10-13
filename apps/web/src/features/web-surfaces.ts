/**
 * Which core operations have a UI surface in the web app. The parity test in `apps/mcp`
 * (and `web-surfaces.test.ts` here) read this list: a new operation must either appear in
 * `WEB_SURFACES` (with the route or component that exposes it) or be listed in `UI_EXEMPT` with
 * a reason.
 */
export type WebSurface = {
  /** Core operation name, e.g. `venue.create`. */
  operation: string;
  /**
   * Route pattern below `src/app/[locale]/(app)`, e.g. `/venues/[id]`, or `"*"` for UI that
   * lives in the app shell on every page (then `component` names the file).
   */
  route: string;
  /** With `route: "*"`: the component file below `src/` that provides the UI. */
  component?: string;
};

export type UiExempt = { operation: string; reason: string };

/** The assistant panel (conversation history, rename, archive, chat) is mounted on every page. */
const PANEL = { route: "*", component: "features/assistant/ui/assistant-panel.tsx" } as const;

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
  { operation: "skill.list", route: "/skills" },
  { operation: "skill.get", route: "/skills/[id]" },
  { operation: "skill.create", route: "/skills/new" },
  { operation: "skill.update", route: "/skills/[id]/edit" },
  { operation: "skill.publish", route: "/skills/[id]" },
  { operation: "skill.archive", route: "/skills/[id]" },
  { operation: "skill.share", route: "/skills/[id]" },
  { operation: "skill.export", route: "/skills/[id]" },
  { operation: "skill.import", route: "/skills" },
  // The chat route (`/api/chat`) creates conversations and appends messages as the user; the
  // panel lists, opens, renames and archives them.
  { operation: "conversation.list", ...PANEL },
  { operation: "conversation.get", ...PANEL },
  { operation: "conversation.create", ...PANEL },
  { operation: "conversation.rename", ...PANEL },
  { operation: "conversation.archive", ...PANEL },
  { operation: "message.list", ...PANEL },
  { operation: "message.append", ...PANEL },
];

/** Operations deliberately without UI. Every entry needs a reason; remove it when UI ships. */
export const UI_EXEMPT: readonly UiExempt[] = [];
