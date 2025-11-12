// EVA DA 2.0 Design System - Main Export
// Beautiful, accessible, government-compliant UI components
// 🎨 Agent 2: Design System Expert

// 🎨 CORE COMPONENTS
export {
  GlassCard,
  AgentDashboardCard,
  AgentDashboard,
  EnhancedAgentCard,
  ChatMessage,
  ResponsiveGrid,
  MetricCard,
  StatusBadge,
  ProgressSection,
  SearchInput,
  SelectDropdown,
  Button
} from './components/BeautifulComponents';

// 📱 RESPONSIVE LAYOUT COMPONENTS
export {
  ResponsiveLayout,
  AgentNavigation,
  DashboardHeader,
  CardGrid,
  DashboardFooter
} from './components/ResponsiveLayout';

// ♿ ACCESSIBILITY COMPONENTS
export {
  AccessibilityDashboard,
  AccessibleInput,
  SkipLink,
  AccessibleThemeToggle
} from './components/AccessibilityComponents';

// 🎨 DESIGN TOKENS & THEMES
export {
  governmentLightTheme,
  governmentDarkTheme,
  highContrastTheme
} from './themes/EnterpriseTheme';

// 🎯 TYPE DEFINITIONS
export type {
  ThemeColors,
  ThemeStyles
} from './themes/EnterpriseTheme';

// 📋 CSS IMPORTS (for consuming applications)
import './styles/eva-design-tokens.css';
import './styles/beautiful-ui.css';
import './styles/responsive-layout.css';
import './styles/accessibility.css';

// 🚀 DESIGN SYSTEM VERSION
export const EVA_DESIGN_SYSTEM_VERSION = '2.0.0';

// 🎨 DESIGN SYSTEM CONFIGURATION
export const designSystemConfig = {
  name: 'EVA DA 2.0 Design System',
  version: EVA_DESIGN_SYSTEM_VERSION,
  description: 'Beautiful, accessible, government-compliant UI components',
  author: 'Agent 2: Design System Expert',
  features: [
    '🎨 Glass Morphism Effects',
    '♿ WCAG 2.1 AA Compliance',
    '📱 Mobile-First Responsive Design',
    '🌙 Multi-Theme Support (Light, Dark, High Contrast)',
    '🎯 Government Standards Compliance',
    '🔧 TypeScript Support',
    '⚡ Framer Motion Animations',
    '🧪 Comprehensive Storybook Documentation',
    '🎪 6-Agent Color System',
    '💎 Beautiful Visual Effects'
  ],
  agents: {
    data: {
      name: 'Data Architecture Expert',
      color: '#a78bfa',
      icon: '🗃️'
    },
    design: {
      name: 'Design System Expert',
      color: '#f472b6',
      icon: '🎨'
    },
    monitoring: {
      name: 'Monitoring Specialist',
      color: '#34d399',
      icon: '📊'
    },
    security: {
      name: 'Security Guardian',
      color: '#fbbf24',
      icon: '🔒'
    },
    api: {
      name: 'API Integration Expert',
      color: '#60a5fa',
      icon: '🔌'
    },
    config: {
      name: 'Configuration Manager',
      color: '#818cf8',
      icon: '⚙️'
    }
  }
};

// 🎯 UTILITY FUNCTIONS
export const getAgentConfig = (agentType: keyof typeof designSystemConfig.agents) => {
  return designSystemConfig.agents[agentType];
};

export const getAllAgentTypes = () => {
  return Object.keys(designSystemConfig.agents) as Array<keyof typeof designSystemConfig.agents>;
};

// 🎨 THEME UTILITIES
export const applyTheme = (theme: 'light' | 'dark' | 'high-contrast') => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Store theme preference
    localStorage.setItem('eva-theme', theme);
    
    // Announce theme change for accessibility
    const announcement = `Theme changed to ${theme}`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1000);
  }
};

export const getStoredTheme = (): 'light' | 'dark' | 'high-contrast' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('eva-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'high-contrast') {
      return stored;
    }
    
    // Auto-detect user preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    }
  }
  return 'light';
};

// 🔧 INITIALIZATION FUNCTION
export const initializeEVADesignSystem = (options?: {
  theme?: 'light' | 'dark' | 'high-contrast' | 'auto';
  skipLinks?: boolean;
  announceReady?: boolean;
}) => {
  const { 
    theme = 'auto', 
    skipLinks = true, 
    announceReady = true 
  } = options || {};

  if (typeof document === 'undefined') return;

  // Apply initial theme
  const initialTheme = theme === 'auto' ? getStoredTheme() : theme;
  applyTheme(initialTheme);

  // Add skip links for accessibility
  if (skipLinks) {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'eva-skip-link';
    skipLink.addEventListener('focus', (e) => {
      (e.target as HTMLElement).scrollIntoView();
    });
    document.body.prepend(skipLink);
  }

  // Announce system ready for screen readers
  if (announceReady) {
    setTimeout(() => {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = 'EVA DA 2.0 Design System loaded and ready';
      document.body.appendChild(announcer);
      setTimeout(() => {
        if (document.body.contains(announcer)) {
          document.body.removeChild(announcer);
        }
      }, 2000);
    }, 1000);
  }

  console.log(`🎨 EVA DA 2.0 Design System v${EVA_DESIGN_SYSTEM_VERSION} initialized!`);
  console.log(`✨ Features: ${designSystemConfig.features.join(', ')}`);
};

// 📱 RESPONSIVE UTILITIES
export const getBreakpoint = (): 'mobile' | 'tablet' | 'desktop' | 'large' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'desktop';
  return 'large';
};

export const useResponsive = () => {
  if (typeof window === 'undefined') {
    return { 
      isMobile: false, 
      isTablet: false, 
      isDesktop: true, 
      breakpoint: 'desktop' as const 
    };
  }

  const [breakpoint, setBreakpoint] = React.useState(getBreakpoint());

  React.useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet', 
    isDesktop: breakpoint === 'desktop' || breakpoint === 'large',
    breakpoint
  };
};

// 🎨 CSS CUSTOM PROPERTIES HELPER
export const setCSSVariable = (name: string, value: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(`--eva-${name}`, value);
  }
};

export const getCSSVariable = (name: string): string => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--eva-${name}`)
      .trim();
  }
  return '';
};

// 🎯 ACCESSIBILITY HELPERS
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  if (typeof document === 'undefined') return;
  
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  setTimeout(() => {
    if (document.body.contains(announcer)) {
      document.body.removeChild(announcer);
    }
  }, 1000);
};

export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// Add React import for useResponsive hook
import React from 'react';

export default designSystemConfig;
