import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { archiveRole, execute, updateRole } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { invite, withInviter } from "./invitation-helpers";

describe("invitations name roles (ADR 0004, 0020)", () => {
  it("keeps pending invitations in step with role renames and blocks archiving", async () => {
    const context = await withInviter();
    const { id } = unwrap({
      result: await invite({ context, email: "r@example.test", roles: ["Kitchen"] }),
    });
    const role = await context.db.organizationRole.findFirstOrThrow({ where: { role: "Kitchen" } });
    const archive = await execute({ operation: archiveRole, input: { id: role.id }, context });
    expect(errorCode({ result: archive })).toBe("CONFLICT");
    unwrap({
      result: await execute({
        operation: updateRole,
        input: { id: role.id, name: "Galley" },
        context,
      }),
    });
    const row = await getDb().invitation.findUniqueOrThrow({ where: { id } });
    expect(row.role).toBe("Galley");
  });
});
