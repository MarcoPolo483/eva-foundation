import { create } from '@storybook/theming';

export default create({
  base: 'light',
  brandTitle: 'EVA DA 2.0 Design System',
  brandUrl: '/',
  brandImage: undefined,
  brandTarget: '_self',

  // UI Colors
  colorPrimary: '#0ea5e9',
  colorSecondary: '#0284c7',

  // Typography
  fontBase: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',

  // Text colors
  textColor: '#0f172a',
  textInverseColor: '#ffffff',

  // Toolbar default and active colors
  barTextColor: '#64748b',
  barSelectedColor: '#0ea5e9',
  barBg: '#f8fafc',

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  inputTextColor: '#0f172a',
  inputBorderRadius: 8,

  // Brand colors
  appBg: '#ffffff',
  appContentBg: '#f8fafc',
  appBorderColor: '#e2e8f0',
  appBorderRadius: 12,
});
