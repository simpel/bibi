import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const IMPORT =
  "mutation($i: ConfigurationImportTemplateInput!) { configurationImportTemplate(input: $i) { " +
  "created { vocabularies { name } setups { name } entityTypes { name fields { name } } } " +
  "skipped { vocabularies setups entityTypes } } }";

describe("configurationImportTemplate", () => {
  it("imports the starter pack once, then skips everything", async () => {
    const gql = createClient({ context: testContext() });
    const variables = { i: { template: "conference-venue" } };
    const first = await gql({ query: IMPORT, variables });
    expect(first.body.errors).toBeUndefined();
    const created = first.body.data.configurationImportTemplate.created;
    expect(created.entityTypes.map((type: { name: string }) => type.name)).toContain(
      "Conference room",
    );
    expect(created.vocabularies.length).toBeGreaterThan(0);
    const again = await gql({ query: IMPORT, variables });
    const result = again.body.data.configurationImportTemplate;
    expect(result.created.entityTypes).toEqual([]);
    expect(result.skipped.entityTypes).toHaveLength(created.entityTypes.length);
  });
});
