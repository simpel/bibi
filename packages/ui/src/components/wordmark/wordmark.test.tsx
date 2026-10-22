import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Wordmark } from "./wordmark";

describe("Wordmark", () => {
  it("renders as an svg with viewBox and accessibility label", () => {
    const html = renderToString(<Wordmark />);
    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 189 125"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Bibi"');
    expect(html).toContain("<title>Bibi</title>");
    expect(html).toContain('data-slot="wordmark"');
  });

  it("applies preset size classes", () => {
    const smHtml = renderToString(<Wordmark size="sm" />);
    expect(smHtml).toContain("h-6");

    const xlHtml = renderToString(<Wordmark size="xl" />);
    expect(xlHtml).toContain("h-12");
  });

  it("applies numeric height as inline style", () => {
    const html = renderToString(<Wordmark size={48} />);
    expect(html).toContain("height:48px");
    expect(html).toContain("width:auto");
  });

  it("applies custom CSS height string as inline style", () => {
    const html = renderToString(<Wordmark size="3.5rem" />);
    expect(html).toContain("height:3.5rem");
    expect(html).toContain("width:auto");
  });

  it("allows custom aria label", () => {
    const html = renderToString(<Wordmark label="Custom Brand" />);
    expect(html).toContain('aria-label="Custom Brand"');
    expect(html).toContain("<title>Custom Brand</title>");
  });

  it("merges custom className and preserves fill-current", () => {
    const html = renderToString(<Wordmark className="text-primary" />);
    expect(html).toContain("text-primary");
    expect(html).toContain("fill-current");
  });
});
