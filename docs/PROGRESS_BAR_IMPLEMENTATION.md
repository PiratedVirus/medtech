# Progress Bar Implementation

This document describes the implementation of a page redirect progress bar system using NProgress, following industry standards for user experience enhancement.

## Overview

The progress bar system provides visual feedback during:
- Server-side redirects (middleware)
- Client-side navigation (Next.js router)
- Manual operations requiring progress indication

## Components

### 1. ProgressProvider (`components/common/ProgressProvider.tsx`)
- Main provider component that configures NProgress
- Handles browser back/forward navigation
- Provides custom styling for light/dark mode support
- Exports utility functions for manual progress control

### 2. NavigationProgress (`components/common/NavigationProgress.tsx`)
- Intercepts Next.js router methods (push, replace, back, forward)
- Automatically starts progress bar on navigation
- Handles browser popstate events

### 3. MiddlewareProgressHandler (`components/common/MiddlewareProgressHandler.tsx`)
- Detects server-side redirects from middleware
- Shows progress bar for redirects indicated by URL parameters
- Handles external referrer detection

### 4. ProgressBarUtils (`components/common/ProgressBarUtils.tsx`)
- Custom hook `useProgressBar()` for component-level progress control
- Direct utility functions for manual progress management
- Higher-order component `withProgress()` for wrapping async operations

## Usage Examples

### Automatic Progress (Already Implemented)
The progress bar automatically shows for:
- Middleware redirects (login, role-based redirects)
- Client-side navigation using Next.js router
- Browser back/forward navigation

### Manual Progress Control

#### Using the Hook
```tsx
import { useProgressBar } from '@/components/common/ProgressBarUtils'

function MyComponent() {
  const { startProgress, doneProgress } = useProgressBar()

  const handleAsyncOperation = async () => {
    startProgress()
    try {
      await someAsyncOperation()
    } finally {
      doneProgress()
    }
  }

  return <button onClick={handleAsyncOperation}>Start Operation</button>
}
```

#### Using Direct Functions
```tsx
import { progressBar } from '@/components/common/ProgressBarUtils'

function handleFormSubmit() {
  progressBar.start()
  // ... form submission logic
  progressBar.done()
}
```

#### Using Higher-Order Component
```tsx
import { withProgress } from '@/components/common/ProgressBarUtils'

const fetchDataWithProgress = withProgress(async () => {
  const response = await fetch('/api/data')
  return response.json()
})

// Usage
const data = await fetchDataWithProgress()
```

## Configuration

### NProgress Settings
- **Speed**: 500ms for smooth transitions
- **Minimum**: 0.1 (10%) to show immediate feedback
- **Trickle Speed**: 200ms for automatic progress increments
- **Spinner**: Disabled for cleaner appearance

### Styling
- **Height**: 3px for subtle appearance
- **Color**: Blue (#3b82f6) with glow effect
- **Dark Mode**: Lighter blue (#60a5fa) for better contrast
- **Position**: Fixed at top of viewport with high z-index

## Integration Points

### Middleware Integration
- All redirect URLs include `?redirect=true` parameter
- Client-side detects this parameter to show progress
- Handles authentication failures, role-based redirects

### Layout Integration
- ProgressProvider wraps the entire app
- NavigationProgress handles router events
- MiddlewareProgressHandler detects server redirects

## Browser Support
- Modern browsers with CSS3 support
- Graceful degradation for older browsers
- No JavaScript dependencies beyond NProgress

## Performance Considerations
- Minimal bundle size impact (~2KB gzipped)
- No impact on server-side rendering
- Efficient event handling with proper cleanup
- Memory leak prevention through proper cleanup

## Testing Scenarios

### Server-Side Redirects
1. Access protected route without authentication
2. Access route with invalid token
3. Access route with expired token
4. Role-based redirects (DOCTOR → /doctor/home, PATHOLOGY → /pathology)

### Client-Side Navigation
1. Programmatic navigation using router.push()
2. Programmatic navigation using router.replace()
3. Browser back/forward buttons
4. Link clicks (if using Next.js Link component)

### Manual Progress Control
1. Form submissions
2. File uploads
3. API calls
4. Long-running operations

## Troubleshooting

### Progress Bar Not Showing
- Check if ProgressProvider is properly wrapped around the app
- Verify NProgress CSS is loaded
- Check browser console for JavaScript errors

### Progress Bar Stuck
- Ensure `doneProgress()` is called in all code paths
- Use try/finally blocks for async operations
- Check for unhandled promise rejections

### Styling Issues
- Verify CSS is loaded after NProgress
- Check for CSS conflicts with existing styles
- Test in both light and dark modes

## Future Enhancements
- Custom progress bar themes
- Progress bar for specific route patterns
- Integration with loading states
- Analytics for progress bar usage
