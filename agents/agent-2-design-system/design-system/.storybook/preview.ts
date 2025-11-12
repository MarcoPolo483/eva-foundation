import type { Preview } from '@storybook/react';
import '../src/components/design-system/styles/eva-design-tokens.css';
import '../src/components/design-system/styles/beautiful-ui.css';
import '../src/components/design-system/styles/responsive-layout.css';
import '../src/components/design-system/styles/accessibility.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'high-contrast',
          value: '#ffffff',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '390px',
            height: '844px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        large: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'EVA DA 2.0 Theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: '☀️ Light Theme' },
          { value: 'dark', title: '🌙 Dark Theme' },
          { value: 'high-contrast', title: '⚫ High Contrast' },
        ],
        showName: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      // Apply theme to document
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      
      return (
        <div style={{ 
          minHeight: '100vh',
          background: theme === 'dark' ? '#0f172a' : theme === 'high-contrast' ? '#ffffff' : '#ffffff',
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
