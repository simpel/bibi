import type { Meta, StoryObj } from "@storybook/react-vite";

type ColorTokenDef = {
  name: string;
  variable: string;
  fgVariable?: string;
  role: string;
  description: string;
};

type ColorGroup = {
  title: string;
  description: string;
  tokens: ColorTokenDef[];
};

const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Surfaces & Backgrounds",
    description:
      "The structural foundation: clean, luminous light surfaces and deep peat dark surfaces.",
    tokens: [
      {
        name: "Background",
        variable: "background",
        fgVariable: "foreground",
        role: "Main viewport canvas",
        description: "Luminous alabaster chalk. Airy and warm without sterile blue glare.",
      },
      {
        name: "Card",
        variable: "card",
        fgVariable: "card-foreground",
        role: "Elevated content container",
        description: "Pure crisp white in light mode; layered peat in dark mode.",
      },
      {
        name: "Popover",
        variable: "popover",
        fgVariable: "popover-foreground",
        role: "Floating menus & dropdowns",
        description: "Top-level surface for overlays, comboboxes, and tooltips.",
      },
      {
        name: "Sidebar",
        variable: "sidebar",
        fgVariable: "sidebar-foreground",
        role: "App navigation surface",
        description: "Subtle architectural tint differentiating navigation from workspace.",
      },
    ],
  },
  {
    title: "Brand & Primary Actions",
    description:
      "Dignified Nordic Spruce primary and warm aged brass accents reflecting manor heritage.",
    tokens: [
      {
        name: "Primary",
        variable: "primary",
        fgVariable: "primary-foreground",
        role: "Primary action & brand focus",
        description: "Deep Nordic Spruce green. Confident, grounded, high contrast.",
      },
      {
        name: "Secondary",
        variable: "secondary",
        fgVariable: "secondary-foreground",
        role: "Secondary actions & quiet tabs",
        description: "Soft limestone pebble tint for low-emphasis controls.",
      },
      {
        name: "Accent",
        variable: "accent",
        fgVariable: "accent-foreground",
        role: "Hover states & selections",
        description: "Warm aged brass / honey tint creating tactile warmth on interaction.",
      },
    ],
  },
  {
    title: "Feedback & Status",
    description:
      "Semantic signaling for booking confirmations, attention alerts, and destructive steps.",
    tokens: [
      {
        name: "Success",
        variable: "success",
        fgVariable: "success-foreground",
        role: "Confirmed quotes, signed runsheets",
        description: "Meadow sage spruce signaling resolved states and green lights.",
      },
      {
        name: "Warning",
        variable: "warning",
        fgVariable: "warning-foreground",
        role: "Expiring holds, capacity alerts",
        description: "Warm honey amber drawing timely operational attention.",
      },
      {
        name: "Destructive",
        variable: "destructive",
        fgVariable: "destructive-foreground",
        role: "Cancellations, releases, archiving",
        description: "Heritage madder terracotta. Noticeable alert without neon harshness.",
      },
    ],
  },
  {
    title: "Interface & Neutral Structure",
    description: "Borders, text hierarchy, and keyboard focus indicators.",
    tokens: [
      {
        name: "Foreground",
        variable: "foreground",
        role: "Primary reading text",
        description: "Deep espresso slate providing > 14:1 contrast ratio against canvas.",
      },
      {
        name: "Muted",
        variable: "muted",
        fgVariable: "muted-foreground",
        role: "Subdued backgrounds & chips",
        description: "Gentle sand tone for inactive elements, tags, and table headers.",
      },
      {
        name: "Muted Foreground",
        variable: "muted-foreground",
        role: "Supporting text & timestamps",
        description: "Balanced slate for secondary labels, passing WCAG AA contrast.",
      },
      {
        name: "Border",
        variable: "border",
        role: "Card & table separators",
        description: "Crisp architectural line separating content blocks cleanly.",
      },
      {
        name: "Input",
        variable: "input",
        role: "Form field boundaries",
        description: "Defined boundary for text inputs, selects, and checkboxes.",
      },
      {
        name: "Ring",
        variable: "ring",
        role: "Keyboard focus outline",
        description: "Accessible spruce focus ring adhering to WCAG 2.2 focus visibility.",
      },
    ],
  },
  {
    title: "Data Visualization & Charts",
    description:
      "Harmonious palette for occupancy curves, revenue breakdowns, and booking pipelines.",
    tokens: [
      {
        name: "Chart 1 (Spruce)",
        variable: "chart-1",
        role: "Conferences & room hire",
        description: "Primary category anchor in data charts.",
      },
      {
        name: "Chart 2 (Terracotta)",
        variable: "chart-2",
        role: "Food & beverage catering",
        description: "Warm heritage contrast for meal revenues.",
      },
      {
        name: "Chart 3 (Aged Brass)",
        variable: "chart-3",
        role: "Add-ons & technology rentals",
        description: "Luminous gold for equipment and extras.",
      },
      {
        name: "Chart 4 (Baltic Blue)",
        variable: "chart-4",
        role: "External partner services",
        description: "Calm maritime blue for third-party deliveries.",
      },
      {
        name: "Chart 5 (Lingonberry)",
        variable: "chart-5",
        role: "Special events & private dining",
        description: "Distinct berry tone for seasonal and evening banquets.",
      },
    ],
  },
];

function ColorCard({ token }: { token: ColorTokenDef }) {
  const hasFg = Boolean(token.fgVariable);
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs">
      <div
        className="flex h-24 items-center justify-between p-4"
        style={{
          background: `var(--${token.variable})`,
          color: hasFg ? `var(--${token.fgVariable})` : undefined,
        }}
      >
        <span className="font-serif text-sm font-light tracking-wide">
          {hasFg ? "Aa Sample" : ""}
        </span>
        <span className="rounded bg-black/10 px-2 py-0.5 font-sans text-[10px] backdrop-blur-xs">
          --{token.variable}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm font-normal text-black dark:text-white">
            {token.name}
          </span>
          <span className="font-sans text-xs text-muted-foreground">{token.role}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{token.description}</p>
      </div>
    </div>
  );
}

function ColorsPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      {/* Header - Spartan, no decorative uppercase eyebrow */}
      <header className="flex flex-col gap-2 border-b pb-6">
        <h1 className="font-serif text-3xl font-light tracking-tight text-black dark:text-white">
          Nordic Manor & Heritage Palette
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Rooted in Scandinavian estate architecture: luminous alabaster light surfaces, deep Nordic
          Spruce primary accents, aged brass warmth, and rich espresso typography. Every token is
          calibrated in OKLCH for uniform perceptual contrast.
        </p>
      </header>

      {COLOR_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
              {group.title}
            </h2>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map((token) => (
              <ColorCard key={token.variable} token={token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: "Foundations/Colors",
  component: ColorsPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ColorsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {};
