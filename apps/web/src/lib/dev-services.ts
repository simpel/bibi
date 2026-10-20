export type DevService = { name: string; url: string; note: string };

export type DevServicesInput = { webUrl: string; mcpUrl: string };

/** Local services a developer wants to find: the app plus what `docker compose up` runs. */
export function devServices({ webUrl, mcpUrl }: DevServicesInput): DevService[] {
  return [
    { name: "Web", url: webUrl, note: "The app" },
    { name: "MCP", url: mcpUrl, note: "MCP server for the assistant" },
    {
      name: "Mailpit",
      url: "http://localhost:8025",
      note: "Inbox for all outgoing mail (SMTP :1025)",
    },
    { name: "Storybook", url: "http://localhost:6006", note: "Component library (@okazi/ui)" },
    { name: "Postgres", url: "localhost:5432", note: "Database (pgvector), started by docker:up" },
  ];
}
