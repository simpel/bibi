import type { CompiledRoute } from "./compile-routes";

export type MatchRouteInput = {
  routes: readonly CompiledRoute[];
  method: string;
  pathname: string;
};
export type RouteMatch = { compiled: CompiledRoute; params: Record<string, string> };
type DecodeInput = { value: string };

function decode({ value }: DecodeInput): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function matchRoute({ routes, method, pathname }: MatchRouteInput): RouteMatch | undefined {
  for (const compiled of routes) {
    if (compiled.route.method !== method) continue;
    const match = compiled.pattern.exec(pathname);
    if (!match) continue;
    const entries = compiled.paramNames.map((name, i) => [
      name,
      decode({ value: match[i + 1] ?? "" }),
    ]);
    return { compiled, params: Object.fromEntries(entries) };
  }
  return undefined;
}
