/** Nodes carry a `key` (their offset in the source) so React lists need no array indexes. */
export type Inline = { key: string } & (
  | { type: "text"; text: string }
  | { type: "bold" | "italic"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] }
);

export type ListItem = { key: string; children: Inline[] };

export type Block = { key: string } & (
  | { type: "heading"; level: 1 | 2 | 3; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "quote"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "code"; text: string }
);
