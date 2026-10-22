import type { ColorGroup } from "./color-types";

export const CORE_COLOR_GROUPS: ColorGroup[] = [
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
];
