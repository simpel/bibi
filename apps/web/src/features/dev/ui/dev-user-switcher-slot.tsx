import { getAuth, listDevPlatformAdmins, listDevUsers } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { headers } from "next/headers";
import { devServices } from "@/lib/dev-services";
import { DevUserSwitcher } from "./dev-user-switcher";

/** Server side of the switcher: renders nothing outside development or without seeded users. */
export async function DevUserSwitcherSlot() {
  const [users, admins] = await Promise.all([listDevUsers(), listDevPlatformAdmins()]);
  if (users.length === 0 && admins.length === 0) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  const { WEB_URL, MCP_URL, STORYBOOK_URL } = getEnv();
  const services = devServices({ webUrl: WEB_URL, mcpUrl: MCP_URL, storybookUrl: STORYBOOK_URL });
  return (
    <DevUserSwitcher
      users={users}
      admins={admins}
      services={services}
      currentUserId={session?.user.id ?? null}
    />
  );
}
