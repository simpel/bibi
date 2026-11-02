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
    <StepSection {...args} className="w-[32rem]">
      <Input placeholder="Search customers" />
      <Button className="justify-self-start">Next</Button>
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
