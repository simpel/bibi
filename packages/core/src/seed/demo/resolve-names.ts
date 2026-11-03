import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

export type ResolveNamesInput = {
  kind: string;
  names: readonly string[];
  ids: ReadonlyMap<string, string>;
};

/** The ids of the names, or `INTERNAL` for a name the data files got wrong. */
export function resolveNames({ kind, names, ids }: ResolveNamesInput): Result<string[]> {
  const found: string[] = [];
  for (const name of names) {
    const id = ids.get(name);
    if (!id)
      return err({ error: new AppError({ code: "INTERNAL", message: `Unknown ${kind} ${name}` }) });
    found.push(id);
  }
  return ok({ value: found });
}
