import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Wordmark } from "./wordmark";

describe("Wordmark", () => {
  it("renders the default app name Bibi", () => {
    const html = renderToString(<Wordmark />);
    expect(html).toContain("Bibi");
    expect(html).toContain('data-slot="wordmark"');
    expect(html).toContain("font-wordmark");
  });

  it("renders custom children", () => {
    const html = renderToString(<Wordmark>Custom</Wordmark>);
    expect(html).toContain("Custom");
  });

  it("renders with custom name prop", () => {
    const html = renderToString(<Wordmark name="Bibi App" />);
    expect(html).toContain("Bibi App");
  });

  it("applies size variant classes", () => {
    const smHtml = renderToString(<Wordmark size="sm" />);
    expect(smHtml).toContain("text-lg");

    const xlHtml = renderToString(<Wordmark size="xl" />);
    expect(xlHtml).toContain("text-4xl");
  });
});
