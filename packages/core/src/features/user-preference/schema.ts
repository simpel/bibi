import { z } from "zod";

/** Any JSON value a preference can hold. */
export type JsonValue = z.core.util.JSONType;

/** Largest stored value: the JSON text of `value`, in UTF-8 bytes. */
export const USER_PREFERENCE_MAX_BYTES = 10 * 1024;

export const USER_PREFERENCE_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

const JsonSchema = z.json();

/**
 * Any JSON value. A custom check rather than `z.json()` itself: its recursive JSON Schema
 * (`$defs`/`$ref`) breaks MCP tool schemas, so surfaces describe it as "any".
 */
export const JsonValueSchema = z.custom<JsonValue>((value) => JsonSchema.safeParse(value).success, {
  message: "Must be a JSON value",
});

const byteSize = ({ value }: { value: unknown }): number =>
  new TextEncoder().encode(JSON.stringify(value)).length;

export const UserPreferenceKeySchema = z
  .string()
  .max(200)
  .regex(USER_PREFERENCE_KEY_PATTERN)
  .describe(
    "Preference key: lowercase letters, digits, '.', '_' and '-', e.g. table.columns.orders",
  );

export const UserPreferenceValueSchema = JsonValueSchema.refine(
  (value) => byteSize({ value }) <= USER_PREFERENCE_MAX_BYTES,
  {
    message: `Value must be at most ${USER_PREFERENCE_MAX_BYTES} bytes as JSON`,
  },
).describe("Any JSON value, at most 10 KB as JSON, e.g. an array of column ids");

/** One of the caller's own UI preferences (ADR 0039). */
export const UserPreferenceSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: JsonValueSchema.nullable(),
  updatedAt: z.date(),
});

export const UserPreferenceListInputSchema = z.object({
  prefix: z
    .string()
    .max(200)
    .optional()
    .describe("Only keys that start with this text, e.g. table.columns."),
});

export const UserPreferenceListOutputSchema = z.object({
  items: z.array(UserPreferenceSchema),
});

export const UserPreferenceSetInputSchema = z.object({
  key: UserPreferenceKeySchema,
  value: UserPreferenceValueSchema,
});

export type UserPreferenceDto = z.infer<typeof UserPreferenceSchema>;
export type UserPreferenceListInput = z.infer<typeof UserPreferenceListInputSchema>;
export type UserPreferenceSetInput = z.infer<typeof UserPreferenceSetInputSchema>;

/** The built-in views a list may offer; a list picks which (orders and run sheets all three). */
export const SAVED_VIEW_DEFAULTS = ["all", "assigned", "following"] as const;

export type SavedViewDefault = (typeof SAVED_VIEW_DEFAULTS)[number];

export const SavedViewNameSchema = z.string().trim().min(1).max(60).describe("The view's name");

/**
 * One view above a list's search (a user preference, `views.<organizationId>.<listId>`): a
 * built-in one by name, or one the member saved, with the search as typed.
 */
export const SavedViewSchema = z.union([
  z.object({ default: z.enum(SAVED_VIEW_DEFAULTS) }),
  z.object({
    id: z.string().min(1).max(40),
    name: SavedViewNameSchema,
    q: z.string().trim().min(1).max(500),
  }),
]);

/** A list's views in order; no row (`null`) means the list's built-in ones. */
export const SavedViewsSchema = z.array(SavedViewSchema).max(30);

/** The name form when saving or renaming a view. */
export const SavedViewNameInputSchema = z.object({ name: SavedViewNameSchema });

export type SavedView = z.infer<typeof SavedViewSchema>;
export type SavedViewNameInput = z.infer<typeof SavedViewNameInputSchema>;
