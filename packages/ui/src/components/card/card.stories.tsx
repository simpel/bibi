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
        <CardTitle>Stora salen</CardTitle>
        <CardDescription>Upp till 120 personer, teater- eller bordsuppställning.</CardDescription>
      </CardHeader>
      <CardContent>Inkluderar projektor, ljud och kaffe.</CardContent>
      <CardFooter>
        <Button size="sm">Visa rum</Button>
      </CardFooter>
    </Card>
  ),
};
