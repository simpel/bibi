import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, resolve } from "node:path";
import nextEnv from "@next/env";

/**
 * `pnpm dev` for the web app. The scheme comes from `WEB_ORIGIN` in the root `.env`, the one
 * place every process reads (web, worker, scripts), so the OAuth client the worker provisions
 * always matches the origin the server runs on. `https://…` adds `--experimental-https` (Next's
 * mkcert certificate) and trusts mkcert's CA for the server's own calls to itself (MCP, OAuth).
 */
nextEnv.loadEnvConfig(resolve(import.meta.dirname, "../../.."));

const origin = new URL(process.env.WEB_ORIGIN ?? "http://localhost:3330");
const port = process.env.WEB_PORT ?? (origin.port || "3330");
const https = origin.protocol === "https:";

/** mkcert's CA folder (`mkcert -CAROOT`), where Next's `--experimental-https` keeps its root. */
function mkcertCaRoot() {
  if (process.env.CAROOT) return process.env.CAROOT;
  if (platform() === "darwin") return join(homedir(), "Library/Application Support/mkcert");
  if (platform() === "win32") return join(process.env.LOCALAPPDATA ?? homedir(), "mkcert");
  return join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"), "mkcert");
}

const env = { ...process.env };
const args = ["dev", "-p", port];
if (https) {
  args.push("--experimental-https");
  const caFile = join(mkcertCaRoot(), "rootCA.pem");
  if (existsSync(caFile)) {
    env.NODE_EXTRA_CA_CERTS = caFile;
  } else {
    console.warn(
      `[dev] ${caFile} is missing: Next creates it now. Restart \`pnpm dev\` once, or the assistant cannot reach MCP over https.`,
    );
  }
}

const child = spawn("next", args, { stdio: "inherit", env, shell: platform() === "win32" });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
