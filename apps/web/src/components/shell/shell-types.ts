/** What the signed-in member may see in the shell; navigation only, pages check again. */
export type ShellAccess = { canConfigure: boolean; platformAdmin: boolean };

export type ShellUser = { name: string; email: string };
