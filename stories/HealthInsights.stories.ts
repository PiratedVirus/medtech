import HealthInsightsCard from "@/components/ui/custom/cd-health-insights-card";
import type { Meta, StoryObj } from "@storybook/react";

// ...existing code...
const meta: Meta<typeof HealthInsightsCard> = {
  title: "Components/HealthInsightsCard",
  component: HealthInsightsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Blood Glucose Level",
    reading: 80,
    unit: "mg/dL",
    statusLabel: "Normal",
    color: "#F8E5D3",
  },
};

export default meta;
type Story = StoryObj<typeof HealthInsightsCard>;

export const Default: Story = {};

export const HighReading: Story = {
  args: {
    title: "Body Far",
    imageSrc: "/icons/body-fat.svg",
    reading: 150,
    statusLabel: "High",
    unit: "mg/dL",
    color: "#FBF0F3",
  },
};