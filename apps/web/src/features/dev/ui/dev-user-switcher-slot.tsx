import { getAuth, listDevUsers } from "@okazi/auth";
import { getEnv } from "@okazi/config";
import { headers } from "next/headers";
import { devServices } from "@/lib/dev-services";
import { DevUserSwitcher } from "./dev-user-switcher";

/** Server side of the switcher: renders nothing outside development or without seeded users. */
export async function DevUserSwitcherSlot() {
  const users = await listDevUsers();
  if (users.length === 0) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  const { WEB_URL, MCP_URL } = getEnv();
  const services = devServices({ webUrl: WEB_URL, mcpUrl: MCP_URL });
  return (
    <DevUserSwitcher users={users} services={services} currentUserId={session?.user.id ?? null} />
  );
}
