import type { Preview } from "@storybook/react";
// import * as nextFontGoogle from 'next/font/google';
import '../app/globals.css';


// Mock the next/font/google to return a basic object (to avoid errors)
// Object.defineProperty(nextFontGoogle, 'Lato', {
//   value: () => ({
//     className: 'font-lato',
//   }),
// });
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
