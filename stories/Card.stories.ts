import type { Meta, StoryObj } from "@storybook/react";
import BookingCard from "../components/patients/home/HomeServiceBookingCard"; // Adjusted path to be consistent

const meta: Meta<typeof BookingCard> = {
  title: "Components/BookingCard",
  component: BookingCard,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Sample Card",
    description: "This is a sample card component.",
    buttonText: "Click Me",
    iconSrc: "/icons/mother.svg",
  },
};

export default meta;
type Story = StoryObj<typeof BookingCard>;

export const Default: Story = {};

export const WithCustomText: Story = {
  args: {
    title: "Custom Title",
    description: "This card has custom text.",
    buttonText: "Learn More",
    iconSrc: "/icons/mother.svg",
  },
};

export const ColoredBackground: Story = {
  args: {
    title: "Dark Theme Card",
    description: "A card with a custom dark background.",
    buttonText: "Explore",
    gradientFrom: "#1E293B", // Dark blue-gray
    gradientTo: "#334155",
  },
};