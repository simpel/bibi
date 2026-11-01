/** One of the signed-in user's sessions as Better Auth's `listSessions` returns it. */
export type SessionRow = {
  id: string;
  token: string;
  userAgent?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};
