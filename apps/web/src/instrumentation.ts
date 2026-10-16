import type { Instrumentation } from "next";

/** Next calls this once when the server starts. */
export async function register(): Promise<void> {
  // NEXT_RUNTIME is Next's own runtime flag (not app configuration). The Node-only imports
  // (Prisma/pg/pino) must stay out of the edge instrumentation bundle, hence the dynamic import.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerCoreOperations, registerDevBanner, registerLogging } = await import(
    "./instrumentation-node"
  );
  registerLogging();
  registerCoreOperations();
  registerDevBanner();
}

/** Every error Next catches (render, route, action) lands in the system log (ADR 0014). */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logRequestError } = await import("./instrumentation-node");
  logRequestError({ error, path: request.path, method: request.method, context });
};
