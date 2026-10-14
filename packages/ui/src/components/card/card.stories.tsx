import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = { title: "Components/Card", component: Card } satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Great hall</CardTitle>
        <CardDescription>Up to 120 people, theatre or table setup.</CardDescription>
      </CardHeader>
      <CardContent>Includes projector, sound and coffee.</CardContent>
      <CardFooter>
        <Button size="sm">Show rooms</Button>
      </CardFooter>
    </Card>
  ),
};
