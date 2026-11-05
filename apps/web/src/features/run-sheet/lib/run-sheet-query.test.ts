import { enMessages as en, svMessages as sv } from "@bibi/i18n";
import { describe, expect, it } from "vitest";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import { buildQueryCatalog } from "@/components/query-search/lib/query-catalog";
import { queryParts } from "@/components/query-search/lib/query-highlight";
import { suggest } from "@/components/query-search/lib/query-suggestions";
import { buildRunSheetQuery } from "./run-sheet-query";

const SV = buildRunSheetQuery({ messages: sv });
const EN = buildRunSheetQuery({ messages: en });
const remote = { members: [], customers: [] };

const texts = ({ text, lang }: { text: string; lang: typeof SV }) =>
  suggest({ text, caret: text.length, catalog: {}, remote, ...lang }).items.map((i) => i.text);

describe("run sheet search", () => {
  it("turns Swedish words into core's", () => {
    const q = "inblandad:jag är:aktuell order:Kök ansvar:Kökschef -är:skickad kund:Volvo";
    expect(toCanonicalQuery({ q, vocabulary: SV.vocabulary })).toBe(
      "involves:me is:current definition:Kök responsibility:Kökschef -is:sent customer:Volvo",
    );
    expect(toCanonicalQuery({ q: "is:oskickad", vocabulary: SV.vocabulary })).toBe("is:unsent");
  });

  it("has no no: qualifier, and highlights the new ones", () => {
    expect(queryParts({ text: "saknar:kontakt", vocabulary: SV.vocabulary })).toHaveLength(1);
    const parts = queryParts({ text: "involves:me", vocabulary: EN.vocabulary });
    expect(parts.map(({ kind }) => kind)).toEqual(["key", "value"]);
  });

  it("suggests the qualifiers and the is values", () => {
    expect(texts({ text: "inbl", lang: SV })).toEqual(["inblandad:"]);
    expect(texts({ text: "", lang: EN })).toHaveLength(13);
    const catalog = buildQueryCatalog({ names: {}, vocabulary: SV.vocabulary });
    const values = suggest({ text: "är:blo", caret: 6, catalog, remote, ...SV }).items;
    expect(values.map(({ text }) => text)).toEqual(["är:blockerad"]);
    expect(texts({ text: "involves:", lang: EN })).toEqual(["involves:me", "-involves:"]);
  });
});
