import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageContainer, PageSection } from "./page-layout";

const block = <div className="h-24 rounded-md border bg-muted" />;

const meta = {
  title: "Components/PageLayout",
  component: PageSection,
  args: { children: <PageContainer>{block}</PageContainer> },
  argTypes: { tone: { control: "select", options: ["default", "card", "muted"] } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Card: Story = { args: { tone: "card", divided: true } };
export const Stacked: Story = {
  render: () => (
    <>
      <PageSection>
        <PageContainer>{block}</PageContainer>
      </PageSection>
      <PageSection tone="card" divided>
        <PageContainer>{block}</PageContainer>
      </PageSection>
    </>
  ),
};

export const Narrow: Story = {
  render: () => (
    <PageSection>
      <PageContainer width="narrow">{block}</PageContainer>
    </PageSection>
  ),
};
