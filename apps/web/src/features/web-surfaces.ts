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
  { operation: "item.list", route: "/items" },
  { operation: "item.get", route: "/items/[id]" },
  { operation: "item.create", route: "/items" },
  { operation: "item.update", route: "/items/[id]" },
  { operation: "item.archive", route: "/items/[id]" },
  { operation: "entityType.list", route: "/settings/types" },
  { operation: "entityType.create", route: "/settings/types" },
  { operation: "configuration.importTemplate", route: "/settings/types" },
  { operation: "entityType.get", route: "/settings/types/[id]" },
  { operation: "entityType.update", route: "/settings/types/[id]" },
  { operation: "entityType.archive", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.list", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.get", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.create", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.update", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.archive", route: "/settings/types/[id]" },
  { operation: "vocabulary.list", route: "/settings/lists" },
  { operation: "vocabulary.create", route: "/settings/lists" },
  { operation: "vocabulary.importTemplate", route: "/settings/lists" },
  { operation: "vocabulary.get", route: "/settings/lists/[id]" },
  { operation: "vocabulary.update", route: "/settings/lists/[id]" },
  { operation: "vocabulary.archive", route: "/settings/lists/[id]" },
  { operation: "vocabulary.addValue", route: "/settings/lists/[id]" },
  { operation: "vocabulary.updateValue", route: "/settings/lists/[id]" },
  { operation: "vocabulary.archiveValue", route: "/settings/lists/[id]" },
  { operation: "setup.list", route: "/settings/setups" },
  { operation: "setup.get", route: "/settings/setups" },
  { operation: "setup.create", route: "/settings/setups" },
  { operation: "setup.update", route: "/settings/setups" },
  { operation: "setup.archive", route: "/settings/setups" },
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
  { operation: "role.list", route: "/settings/roles" },
  { operation: "role.get", route: "/settings/roles" },
  { operation: "role.create", route: "/settings/roles" },
  { operation: "role.update", route: "/settings/roles" },
  { operation: "role.archive", route: "/settings/roles" },
  { operation: "role.importTemplate", route: "/settings/roles" },
  { operation: "member.list", route: "/settings/members" },
  { operation: "member.assignRole", route: "/settings/members" },
  { operation: "member.remove", route: "/settings/members" },
  { operation: "member.invite", route: "/settings/members" },
  { operation: "member.listInvitations", route: "/settings/members" },
  { operation: "member.cancelInvitation", route: "/settings/members" },
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
