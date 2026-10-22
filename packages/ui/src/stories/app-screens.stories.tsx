import type { Meta, StoryObj } from "@storybook/react-vite";
import { AIChatView } from "./screens/ai-chat-view";
import { AppScreenShell } from "./screens/app-screen-shell";
import { DashboardView } from "./screens/dashboard-view";
import { SettingsView } from "./screens/settings-view";

const meta = {
  title: "Screens/Examples",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "End-to-end application screen stories demonstrating the Okazi shell, sidebar navigation, wordmark, and realistic estate workflows.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dashboard View: Executive and operational overview showing real-time occupancy metrics,
 * weekly booking volume vs tentative holds, and active event tickets.
 */
export const Dashboard: Story = {
  render: () => (
    <AppScreenShell activeNav="dashboard" pageTitle="Dashboard">
      <DashboardView />
    </AppScreenShell>
  ),
};

/**
 * Settings View: Configuration hub for estate profile, automatic hold policies,
 * kitchen dietary lock cutoffs, notifications, and Stripe Connect payments.
 */
export const Settings: Story = {
  render: () => (
    <AppScreenShell activeNav="settings" pageTitle="Settings" breadcrumbs={["Administration"]}>
      <SettingsView />
    </AppScreenShell>
  ),
};

/**
 * AI Chat Screen: Conversational interface with generative analytics, contextual
 * occupancy insights, and an inline Recharts comparative capacity bar chart within the response.
 */
export const AIChatWithInlineChart: Story = {
  render: () => (
    <AppScreenShell activeNav="assistant" pageTitle="AI Assistant" breadcrumbs={["Intelligence"]}>
      <AIChatView />
    </AppScreenShell>
  ),
};
