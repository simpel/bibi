import { ADMIN_ROLE } from "../../../../permissions/fixed-roles";
import type { DemoOrgIdentity } from "../../types";

/**
 * Kvarnby Manor (`docs/demo-seed.md`): just signed up and set up nothing. One admin, the
 * defaults a real sign-up gets and the first setup still `PENDING` (ADR 0061).
 */
export const kvarnby: DemoOrgIdentity = {
  slug: "kvarnby-demo",
  name: "Kvarnby Manor",
  timeZone: "Europe/Stockholm",
  users: [{ name: "Ida Wallin", role: ADMIN_ROLE }],
};
