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
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
      </TabsList>
      <TabsContent value="info">Basic details about the venue.</TabsContent>
      <TabsContent value="rooms">List of rooms.</TabsContent>
    </Tabs>
  ),
};
