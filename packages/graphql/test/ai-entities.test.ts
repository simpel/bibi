import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const CREATE_CONVERSATION =
  "mutation($input: ConversationCreateInput!) { conversationCreate(input: $input) { id title status ownerUserId } }";
const APPEND =
  "mutation($input: MessageAppendInput!) { messageAppend(input: $input) { id sequence role parts } }";
const READ_CONVERSATION =
  "query($id: String!) { conversation(id: $id) { title messages { sequence role parts metadata } } }";
const SKILL_MD =
  "---\nname: graf-skill\ndescription: Testar grafen\nallowed-tools: search\n---\nGör så här.";

describe("conversations, messages and skills through GraphQL", () => {
  it("creates a conversation, appends messages and reads them via the graph edge", async () => {
    const context = testContext({ access: "write" });
    const gql = createClient({ context });
    const created = await gql({
      query: CREATE_CONVERSATION,
      variables: { input: { title: "Graf" } },
    });
    expect(created.body.errors).toBeUndefined();
    const conversation = created.body.data.conversationCreate;
    expect(conversation).toMatchObject({
      title: "Graf",
      status: "ACTIVE",
      ownerUserId: context.actor.userId,
    });
    const parts = [{ type: "text", text: "Hej" }];
    const appended = await gql({
      query: APPEND,
      variables: { input: { conversationId: conversation.id, role: "USER", parts } },
    });
    expect(appended.body.data.messageAppend).toMatchObject({ sequence: 0, role: "USER", parts });
    const read = await gql({ query: READ_CONVERSATION, variables: { id: conversation.id } });
    expect(read.body.data.conversation).toEqual({
      title: "Graf",
      messages: [{ sequence: 0, role: "USER", parts, metadata: {} }],
    });
    const list = await gql({ query: "{ conversations { items { id } } }" });
    expect(list.body.data.conversations.items).toEqual([{ id: conversation.id }]);

    const otherUser = createClient({
      context: testContext({ organizationId: context.organizationId, access: "write" }),
    });
    const denied = await otherUser({
      query: READ_CONVERSATION,
      variables: { id: conversation.id },
    });
    expect(denied.body.errors?.[0]?.extensions?.code).toBe("NOT_FOUND");
    const messages = await otherUser({
      query: "query($id: String!) { messages(conversationId: $id) { items { id } } }",
      variables: { id: conversation.id },
    });
    expect(messages.body.errors?.[0]?.extensions?.code).toBe("NOT_FOUND");
  });

  it("imports, publishes, lists and exports skills", async () => {
    const gql = createClient({ context: testContext() });
    const imported = await gql({
      query:
        "mutation($input: SkillImportInput!) { skillImport(input: $input) { id slug scope status allowedTools resources organizationId } }",
      variables: { input: { markdown: SKILL_MD } },
    });
    expect(imported.body.errors).toBeUndefined();
    const skill = imported.body.data.skillImport;
    expect(skill).toMatchObject({
      slug: "graf-skill",
      scope: "PERSONAL",
      status: "DRAFT",
      allowedTools: ["search"],
    });
    const published = await gql({
      query:
        "mutation($input: SkillPublishInput!) { skillPublish(input: $input) { status version } }",
      variables: { input: { id: skill.id } },
    });
    expect(published.body.data.skillPublish).toEqual({ status: "PUBLISHED", version: 1 });
    const list = await gql({ query: '{ skills(scope: "PERSONAL") { items { id name } } }' });
    expect(list.body.data.skills.items).toEqual([{ id: skill.id, name: "graf-skill" }]);
    const exported = await gql({
      query: "query($id: String!) { skillExport(id: $id) { markdown filename } }",
      variables: { id: skill.id },
    });
    expect(exported.body.data.skillExport.filename).toBe("graf-skill/SKILL.md");
    expect(exported.body.data.skillExport.markdown).toContain("Gör så här.");
    const created = await gql({
      query:
        "mutation($input: SkillCreateInput!) { skillCreate(input: $input) { slug resources } }",
      variables: {
        input: {
          name: `Skill ${createId()}`,
          description: "D",
          instructions: "I",
          resources: [{ name: "a.md", content: "x" }],
        },
      },
    });
    expect(created.body.data.skillCreate.resources).toEqual([{ name: "a.md", content: "x" }]);
  });
});
