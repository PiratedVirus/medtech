import OTPVerification from "../app/ui-comp/Otp";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof OTPVerification> = {
  title: "Components/OTPVerification",
  component: OTPVerification,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof OTPVerification>;

export const Default: Story = {
  args: {},
};
