/** Next calls this once when the server starts. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureOperations } = await import("@/server/operations");
  ensureOperations();
}
