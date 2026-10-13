import { describe, expect, it } from "vitest";
import { EMBEDDING_DIMENSIONS, hashEmbedding } from "./placeholder-embedding";

const dot = ({ a, b }: { a: number[]; b: number[] }) =>
  a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);

describe("hashEmbedding", () => {
  it("is deterministic, 1536-dimensional and unit length", () => {
    const first = hashEmbedding({ text: "Herrgård i Göteborg" });
    expect(first).toEqual(hashEmbedding({ text: "Herrgård i Göteborg" }));
    expect(first).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(Math.hypot(...first)).toBeCloseTo(1, 6);
  });

  it("places texts sharing words closer than unrelated texts", () => {
    const a = hashEmbedding({ text: "konferens herrgård Göteborg" });
    const b = hashEmbedding({ text: "herrgård med konferenslokaler" });
    const c = hashEmbedding({ text: "zebra giraffe savannah" });
    expect(dot({ a, b })).toBeGreaterThan(dot({ a, b: c }));
  });

  it("returns a valid unit vector for empty text", () => {
    expect(Math.hypot(...hashEmbedding({ text: "" }))).toBeCloseTo(1, 6);
  });
});
