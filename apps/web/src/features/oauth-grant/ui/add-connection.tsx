import { mcpResourceUrl } from "@bibi/auth";
import { AddConnectionMenu } from "./add-connection-menu";
import { isLocalUrl } from "./mcp-connection";

/**
 * "Add connection" on the profile's connected apps. The MCP address is `MCP_URL` (`@bibi/config`),
 * so each environment shows its own. An AI app registers through its client metadata document
 * (CIMD), signs the user in here and asks for consent, so no key is handed out.
 */
export function AddConnection() {
  const url = mcpResourceUrl();
  return <AddConnectionMenu url={url} local={isLocalUrl({ url })} />;
}
