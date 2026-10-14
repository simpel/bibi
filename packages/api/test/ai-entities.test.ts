import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

const SKILL_MD = "---\nname: rest-skill\ndescription: Testar REST\n---\nInstruktioner.";

describe("conversations, messages and skills over REST", () => {
  it("runs the conversation lifecycle with messages, private to the owner", async () => {
    const org = newOrgId();
    const created = await call({
      method: "POST",
      path: "/conversations",
      org,
      body: { title: "REST" },
    });
    expect(created.status).toBe(201);
    const id = created.json.id;
    const parts = [{ type: "text", text: "Hej" }];
    const appended = await call({
      method: "POST",
      path: `/conversations/${id}/messages`,
      org,
      body: { role: "USER", parts },
    });
    expect(appended.status).toBe(201);
    expect(appended.json).toMatchObject({ conversationId: id, sequence: 0, parts });
    const messages = await call({ path: `/conversations/${id}/messages?limit=10`, org });
    expect(messages.json.items.map((m: { id: string }) => m.id)).toEqual([appended.json.id]);
    const renamed = await call({
      method: "PATCH",
      path: `/conversations/${id}`,
      org,
      body: { title: "Ny" },
    });
    expect(renamed.json.title).toBe("Ny");
    const list = await call({ path: "/conversations", org });
    expect(list.json.items.map((c: { id: string }) => c.id)).toEqual([id]);

    const other = { org, user: "someone-else", access: "write" };
    expect((await call({ path: `/conversations/${id}`, ...other })).status).toBe(404);
    expect((await call({ path: `/conversations/${id}/messages`, ...other })).status).toBe(404);
    expect((await call({ path: "/conversations?allUsers=true", ...other })).status).toBe(403);
    expect((await call({ path: `/conversations/${id}`, org: newOrgId() })).status).toBe(404);

    const archived = await call({ method: "DELETE", path: `/conversations/${id}`, org });
    expect(archived.json.status).toBe("ARCHIVED");
  });

  it("imports, publishes, shares, exports and archives skills", async () => {
    const org = newOrgId();
    const imported = await call({
      method: "POST",
      path: "/skills/import",
      org,
      body: { markdown: SKILL_MD },
    });
    expect(imported.status).toBe(201);
    expect(imported.json).toMatchObject({ slug: "rest-skill", scope: "PERSONAL", status: "DRAFT" });
    const id = imported.json.id;
    const published = await call({ method: "POST", path: `/skills/${id}/publish`, org });
    expect(published.status).toBe(200);
    expect(published.json.status).toBe("PUBLISHED");
    const patched = await call({
      method: "PATCH",
      path: `/skills/${id}`,
      org,
      body: { name: "REST skill" },
    });
    expect(patched.json).toMatchObject({ name: "REST skill", version: 2 });
    const exported = await call({ path: `/skills/${id}/export`, org });
    expect(exported.json.markdown).toContain('title: "REST skill"');
    const shared = await call({ method: "POST", path: `/skills/${id}/share`, org });
    expect(shared.status).toBe(201);
    expect(shared.json).toMatchObject({ scope: "ORGANIZATION", status: "DRAFT" });
    const orgSkills = await call({
      path: "/skills?scope=ORGANIZATION",
      org,
      user: "member-2",
      access: "write",
    });
    expect(orgSkills.json.items.map((s: { id: string }) => s.id)).toEqual([shared.json.id]);
    const created = await call({
      method: "POST",
      path: "/skills",
      org,
      body: { name: "Manuell", description: "D", instructions: "I" },
    });
    expect(created.json.slug).toBe("manuell");
    expect((await call({ path: `/skills/${created.json.id}`, org })).status).toBe(200);
    const archived = await call({ method: "DELETE", path: `/skills/${created.json.id}`, org });
    expect(archived.json.status).toBe("ARCHIVED");
  });
});
