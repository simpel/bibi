import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = { title: "Components/Tabs", component: Tabs } satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="info" className="w-96">
      <TabsList>
        <TabsTrigger value="info">Information</TabsTrigger>
        <TabsTrigger value="rooms">Rum</TabsTrigger>
      </TabsList>
      <TabsContent value="info">Grunduppgifter om anläggningen.</TabsContent>
      <TabsContent value="rooms">Lista över rum.</TabsContent>
    </Tabs>
  ),
};
