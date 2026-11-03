import { describe, expect, it } from "vitest";
import { toCanonicalQuery } from "./query-canonical";
import { EN_VOCABULARY, SV_VOCABULARY } from "./test-vocabularies";

const sv = ({ q }: { q: string }) => toCanonicalQuery({ q, vocabulary: SV_VOCABULARY });

describe("toCanonicalQuery", () => {
  it("turns Swedish qualifiers and fixed values into core's words", () => {
    expect(sv({ q: "ansvarig:jag -är:stängd kickoff" })).toBe("assignee:me -is:closed kickoff");
    expect(sv({ q: "saknar:kontakt,datum option:utgången när:2026-12" })).toBe(
      "no:contact,date holds:expired when:2026-12",
    );
  });

  it("accepts English words and typing without accents in any UI language", () => {
    expect(sv({ q: "assignee:me nar:>2026-12-01 gaster:>50" })).toBe(
      "assignee:me when:>2026-12-01 guests:>50",
    );
  });

  it("keeps names, quotes, unknown words and free text as typed", () => {
    expect(sv({ q: 'kund:"Volvo Cars",jag status:Lead rum:12 "jag"' })).toBe(
      'customer:"Volvo Cars",jag status:Lead rum:12 "jag"',
    );
  });

  it("leaves an English search untouched", () => {
    const q = "assignee:me -status:Lost customer:volvo";
    expect(toCanonicalQuery({ q, vocabulary: EN_VOCABULARY })).toBe(q);
  });
});
