import { getAuth } from "@okazi/auth";

// RFC 8414 discovery. The issuer is `${BETTER_AUTH_URL}/api/auth`, so clients ask for
// `/.well-known/oauth-authorization-server/api/auth`; Better Auth's OAuth provider answers it.
export const GET = (request: Request) => getAuth().handler(request);
