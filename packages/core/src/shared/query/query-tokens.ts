/**
 * One search word: an optional `-`, an optional `key:` (any letters, so a UI can map its own
 * language's words, ADR 0009), then quoted and bare pieces (`"Volvo Cars",Lead`).
 */
export const QUERY_TOKEN = /(-)?(?:(\p{L}+):)?((?:"[^"]*"?|[^\s"]+)+)/giu;

/** One comma-separated piece of a value: quoted (group 1) or bare (group 2). */
export const QUERY_PIECE = /"([^"]*)"?|([^,"]+)/gu;
