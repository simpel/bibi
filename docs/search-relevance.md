# Search relevance test

ADR 0008 requires hybrid search to be tested on real examples. The test is
`packages/core/test/search-relevance.test.ts`, with the fixture in
`packages/core/test/relevance/fixture.ts`.

## What it checks
- A small realistic organization (3 venues, 5 items, 2 skills) is indexed through the normal
  indexing hook against real Postgres.
- Each fixture query (English and Swedish) names the entity that must be a hit.
- **Threshold:** the expected entity must be in the top 3 results (`TOP_N`).
- A change to `packages/db/src/embeddings/search-embeddings.ts` (or to what an entity embeds as
  text) that pushes an expected hit out of the top 3 fails the test.

## Parameters under test
- Reciprocal rank fusion: `score = 1/(k + rank_vector) + 1/(k + rank_fts)`, with `k = 60`.
- 50 candidates per branch (`CANDIDATES`), full-text with the `simple` configuration and
  `websearch_to_tsquery`, cosine distance for the vector branch.
- If you change `RRF_K` or `CANDIDATES`, rerun the test with both variants below and update this
  document.

## Variants
- **Hash embeddings (default, `pnpm test`):** deterministic bag-of-words vectors. This only covers
  queries that share words with the target, so it guards the fusion and full-text mechanics.
  Queries marked `semantic: true` are skipped.
- **Real model (manual or nightly, not in CI):** also runs the `semantic` queries (no shared
  words, e.g. Swedish phrasing against English text). Uses the AI Gateway and needs a 1536
  dimension model:

```sh
RELEVANCE_GATEWAY_KEY=... RELEVANCE_EMBEDDING_MODEL=openai/text-embedding-3-small \
  pnpm --filter @bibi/core exec vitest run test/search-relevance.test.ts
```

## Adding a case
Add the entity to the fixture and a `{ query, expect }` row. Keep fixtures realistic and queries
what staff would type. Mark queries without shared words as `semantic: true`.
