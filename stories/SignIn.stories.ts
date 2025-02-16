import SignIn from "../app/ui-comp/SignIn";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof SignIn> = {
  title: "Components/SignIn",
  component: SignIn,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SignIn>;

export const Default: Story = {
  args: {},
};
