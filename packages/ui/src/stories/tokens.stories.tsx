import type { Meta, StoryObj } from "@storybook/react-vite";

const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "popover",
  "primary",
  "primary-foreground",
  "secondary",
  "muted",
  "muted-foreground",
  "accent",
  "destructive",
  "success",
  "warning",
  "border",
  "input",
  "ring",
] as const;

const RADIUS_TOKENS = ["sm", "md", "lg", "xl"] as const;
const SHADOW_TOKENS = ["xs", "sm", "md", "lg"] as const;
const FONT_TOKENS = ["sans", "serif", "mono"] as const;

function Swatch({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-md border" style={{ background: `var(--${name})` }} />
      <code className="text-xs">--{name}</code>
    </div>
  );
}

function TokensPage() {
  return (
    <div className="grid w-[48rem] max-w-full gap-8 p-4">
      <section className="grid grid-cols-2 gap-3">
        {COLOR_TOKENS.map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </section>
      <section className="flex gap-4">
        {RADIUS_TOKENS.map((name) => (
          <div
            key={name}
            className="flex size-16 items-center justify-center border bg-muted text-xs"
            style={{ borderRadius: `var(--radius-${name})` }}
          >
            {name}
          </div>
        ))}
      </section>
      <section className="flex gap-4">
        {SHADOW_TOKENS.map((name) => (
          <div
            key={name}
            className="flex size-16 items-center justify-center rounded-lg bg-card text-xs"
            style={{ boxShadow: `var(--shadow-${name})` }}
          >
            {name}
          </div>
        ))}
      </section>
      <section className="grid gap-2">
        {FONT_TOKENS.map((name) => (
          <p key={name} className="text-lg" style={{ fontFamily: `var(--font-${name})` }}>
            --font-{name}: Anläggning och rum
          </p>
        ))}
      </section>
    </div>
  );
}

const meta = { title: "Foundations/Tokens", component: TokensPage } satisfies Meta<typeof TokensPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
