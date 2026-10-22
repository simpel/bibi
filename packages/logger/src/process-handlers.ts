import { getLogger } from "./root-logger";

export type InstallProcessHandlersInput = {
  /** Standalone servers exit after an uncaught exception (state is unknown). Next manages its own. */
  exitOnUncaught: boolean;
};

const KEY = Symbol.for("bibi.logger.processHandlers");

/** Crashes and forgotten promises end up in the system log, not only on a terminal (ADR 0014). */
export function installProcessHandlers({ exitOnUncaught }: InstallProcessHandlersInput): void {
  const holder = globalThis as typeof globalThis & { [KEY]?: true };
  if (holder[KEY]) return;
  holder[KEY] = true;
  process.on("unhandledRejection", (reason) => {
    getLogger().error({ event: "process.unhandledRejection", err: reason });
  });
  process.on("uncaughtException", (error) => {
    getLogger().fatal({ event: "process.uncaughtException", err: error });
    if (exitOnUncaught) process.exit(1);
  });
}
