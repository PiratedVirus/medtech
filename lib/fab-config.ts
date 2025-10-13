/**
 * Configuration for the Floating Action Button (FAB)
 * Customize contact information and behavior here
 */

export const FAB_CONFIG = {
  // Contact Information
  phoneNumber: "+91-9876543210", // Your support phone number
  whatsappNumber: "+91-9876543210", // Your WhatsApp number (can be same as phone)
  
  // Behavior Settings
  showWhatsApp: true, // Set to false to hide WhatsApp option
  showAfterDelay: 2000, // Delay in milliseconds before showing FAB (2 seconds)
  
  // UX Settings
  hideOnScroll: true, // Hide FAB when scrolling down
  showOnScrollUp: true, // Show FAB when scrolling up
  dismissible: true, // Allow users to dismiss the FAB
  
  // Visual Settings
  color: "green", // Button color theme
  size: "large", // Button size (small, medium, large)
  
  // Pages to hide FAB on
  hiddenPages: [
    "/admin", // Admin pages
    "/login", // Login page
    "/signup", // Signup page
    "/register", // Registration page
    "/", // Landing page (exact match only)
  ],
  
  // Mobile specific settings
  mobile: {
    bottomOffset: "bottom-20", // Offset from bottom on mobile (respects bottom nav)
    desktopOffset: "md:bottom-6", // Offset from bottom on desktop
  },
  
  // WhatsApp message template
  whatsappMessage: "Hi! I need help with my account.",
} as const;

export type FABConfig = typeof FAB_CONFIG;
