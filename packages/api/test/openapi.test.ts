import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import { call, handler, type Json } from "./helpers";

type Doc = {
  openapi: string;
  paths: Record<string, Record<string, { operationId: string }>>;
  [k: string]: Json;
};

async function loadDocument(): Promise<Doc> {
  const result = await call({ path: "/openapi.json" });
  expect(result.status).toBe(200);
  return result.json as Doc;
}

describe("OpenAPI document", () => {
  it("is a valid OpenAPI 3.1 document", async () => {
    const doc = await loadDocument();
    expect(doc.openapi).toBe("3.1.0");
    const validated = await SwaggerParser.validate(structuredClone(doc) as never);
    expect(validated).toBeTruthy();
  });

  it("describes routes, unique operationIds, security and schemas", async () => {
    const doc = await loadDocument();
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        "/venues",
        "/venues/{id}",
        "/venues/{venueId}/items",
        "/items/{id}",
        "/entity-types/{entityTypeId}/fields",
        "/vocabularies/import-template",
        "/search",
      ]),
    );
    const ids = Object.values(doc.paths).flatMap((item) =>
      Object.values(item).map((o) => o.operationId),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(doc.paths["/venues"]?.get?.operationId).toBe("venueList");
    expect(Object.keys(doc.components.securitySchemes)).toEqual(["apiKey", "session", "oauth2"]);
    const post = doc.paths["/venues"]?.post as Json;
    expect(post.requestBody.content["application/json"].schema.properties.name).toBeDefined();
    expect(
      post.responses["201"].content["application/json"].schema.properties.createdAt.format,
    ).toBe("date-time");
    const list = doc.paths["/venues"]?.get as Json;
    expect(list.parameters.map((p: { name: string }) => p.name)).toEqual(["limit", "cursor"]);
  });

  it("needs no authentication and serves the docs page", async () => {
    const docs = await handler(new Request("http://localhost:3000/api/v1/docs"));
    expect(docs.status).toBe(200);
    expect(docs.headers.get("content-type")).toContain("text/html");
    expect(await docs.text()).toContain("/api/v1/openapi.json");
  });
});
