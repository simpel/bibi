/** Next calls this once when the server starts. */
export async function register(): Promise<void> {
  // NEXT_RUNTIME is Next's own runtime flag (not app configuration). The Node-only imports
  // (Prisma/pg) must stay out of the edge instrumentation bundle, hence the dynamic import.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerCoreOperations } = await import("./instrumentation-node");
  registerCoreOperations();
}
