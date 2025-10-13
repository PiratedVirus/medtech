// Suppress common browser extension errors that don't affect functionality
export function suppressExtensionErrors() {
  if (typeof window !== 'undefined') {
    // Override console.error to filter out extension-related errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Filter out common extension errors
      if (
        message.includes('runtime.lastError') ||
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Extension context invalidated') ||
        message.includes('chrome-extension://') ||
        message.includes('moz-extension://')
      ) {
        // Suppress these errors silently
        return;
      }
      
      // Log other errors normally
      originalError.apply(console, args);
    };

    // Also suppress unhandled promise rejections from extensions
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason?.toString() || '';
      if (
        reason.includes('runtime.lastError') ||
        reason.includes('Could not establish connection') ||
        reason.includes('Receiving end does not exist')
      ) {
        event.preventDefault();
      }
    });
  }
}
