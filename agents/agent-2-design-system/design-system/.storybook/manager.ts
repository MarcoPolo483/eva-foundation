import { addons } from '@storybook/manager-api';
import evaTheme from './eva-theme';

addons.setConfig({
  theme: evaTheme,
  panelPosition: 'bottom',
  sidebar: {
    showRoots: false,
  },
});
