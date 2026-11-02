import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { StepSection } from "./step-section";

const meta = {
  title: "Components/StepSection",
  component: StepSection,
  args: { number: 1, title: "Who is it for?", state: "open" },
  argTypes: { state: { control: "select", options: ["open", "done", "locked"] } },
} satisfies Meta<typeof StepSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: (args) => (
    <StepSection
      {...args}
      className="w-[32rem]"
      footerEnd={<Button type="button">Next: when</Button>}
    >
      <Input placeholder="Search customers" />
    </StepSection>
  ),
};

/** Title-row actions (right, open only) and the footer: a ghost Back left, Next right. */
export const WithActionsAndFooter: Story = {
  args: { number: 3, title: "Package or one-off" },
  render: (args) => (
    <StepSection
      {...args}
      className="w-[40rem]"
      actions={
        <>
          <Button type="button" variant="outline" size="sm">
            Create package
          </Button>
          <Button type="button" variant="secondary" size="sm" aria-pressed>
            One-off
          </Button>
        </>
      }
      footerStart={
        <Button type="button" variant="ghost">
          Back
        </Button>
      }
      footerEnd={<Button type="button">Next: review</Button>}
    >
      <Input placeholder="Packages" />
    </StepSection>
  ),
};

export const Done: Story = {
  args: {
    state: "done",
    summary: "Volvo Cars · Anna Berg",
    changeLabel: "Change",
    onChangeStep: () => {},
  },
  render: (args) => <StepSection {...args} className="w-[32rem]" />,
};

export const Locked: Story = {
  args: { number: 3, title: "Package or one-off", state: "locked" },
  render: (args) => <StepSection {...args} className="w-[32rem]" />,
};

export const Flow: Story = {
  render: () => (
    <div className="grid w-[32rem] gap-3">
      <StepSection
        number={1}
        title="Who"
        state="done"
        summary="Volvo Cars · Anna Berg"
        changeLabel="Change"
        onChangeStep={() => {}}
      />
      <StepSection number={2} title="When and how many" state="open">
        <Input placeholder="Guests" />
      </StepSection>
      <StepSection number={3} title="Package or one-off" state="locked" />
    </div>
  ),
};
