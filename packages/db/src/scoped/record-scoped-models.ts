/**
 * Record-scoped models and the root whose visibility they share (ADR 0113). A query on one, or a
 * relation hop into one from another root, must declare its intent (`context.records` or
 * `context.engine`); the plain scoped client refuses it. Hops between models of one root are free:
 * a visible line implies its visible order. A model joins this map only once every query on it is
 * converted, so each step stays green.
 */
export const RECORD_SCOPED_MODELS: ReadonlyMap<string, string> = new Map<string, string>([]);
