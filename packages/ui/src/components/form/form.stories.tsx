import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm, useFormContext } from "react-hook-form";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { Form, FormController } from "./form-context";
import { FormControl } from "./form-control";
import { FormItem } from "./form-item";
import { FormLabel } from "./form-label";
import { FormDescription, FormMessage } from "./form-message";

type Values = { name: string; email: string };

const meta = { title: "Components/Form", component: Form } satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

function EmailField() {
  const { control } = useFormContext<Values>();
  return (
    <FormController
      control={control}
      name="email"
      rules={{
        required: "E-post krävs",
        pattern: { value: /.+@.+/, message: "Ogiltig e-post" },
      }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>E-post</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function Demo() {
  const form = useForm<Values>({ defaultValues: { name: "", email: "" }, mode: "onBlur" });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="grid w-80 gap-4">
        <FormController
          control={form.control}
          name="name"
          rules={{ required: "Namn krävs" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namn</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Visas för gäster.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <EmailField />
        <Button type="submit">Spara</Button>
      </form>
    </Form>
  );
}

export const Default: Story = { args: { children: null } as never, render: () => <Demo /> };
