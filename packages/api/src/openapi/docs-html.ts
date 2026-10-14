export type DocsHtmlInput = { specUrl: string };

/** Scalar API reference page (loaded from CDN) pointing at the generated OpenAPI document. */
export function docsHtml({ specUrl }: DocsHtmlInput): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Okazi API</title>
  </head>
  <body>
    <script id="api-reference" data-url="${specUrl}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.34.6"></script>
  </body>
</html>`;
}
