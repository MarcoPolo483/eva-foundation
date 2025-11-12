// EVA DA 2.0 Enterprise Design System
// Stunning visual themes with government accessibility compliance
// Modern glass morphism, shadows, and smooth animations

export interface ThemeColors {
  // Primary brand colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // Surface colors for glass morphism
  surface: {
    background: string;
    paper: string;
    elevated: string;
    glass: string;
    overlay: string;
  };
  
  // Text and content
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Agent-specific colors
  agents: {
    dataArchitecture: string;
    designSystem: string;
    monitoring: string;
    security: string;
    apiIntegration: string;
    configuration: string;
  };
}

export interface ThemeStyles {
  // Glass morphism effects
  glass: {
    background: string;
    border: string;
    shadow: string;
    backdrop: string;
  };
  
  // Elevation and shadows
  elevation: {
    none: string;
    small: string;
    medium: string;
    large: string;
    floating: string;
  };
  
  // Border radius for modern look
  borderRadius: {
    none: string;
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
      display: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  
  // Spacing system
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  
  // Animation and transitions
  animation: {
    transition: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      easeInOut: string;
      easeOut: string;
      easeIn: string;
      bounce: string;
    };
  };
}

// 🌟 GOVERNMENT LIGHT THEME - Professional & Clean
export const governmentLightTheme: ThemeColors & { styles: ThemeStyles } = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',    // Primary brand color - Government blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  surface: {
    background: '#ffffff',
    paper: '#f8fafc',
    elevated: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.85)',
    overlay: 'rgba(15, 23, 42, 0.05)',
  },
  
  text: {
    primary: '#0f172a',      // Slate 900 - WCAG AAA compliant
    secondary: '#475569',     // Slate 600
    disabled: '#94a3b8',      // Slate 400
    inverse: '#ffffff',
  },
  
  semantic: {
    success: '#059669',       // Emerald 600
    warning: '#d97706',       // Amber 600
    error: '#dc2626',         // Red 600
    info: '#2563eb',          // Blue 600
  },
  
  agents: {
    dataArchitecture: '#8b5cf6',   // Violet 500
    designSystem: '#ec4899',       // Pink 500
    monitoring: '#10b981',         // Emerald 500
    security: '#f59e0b',           // Amber 500
    apiIntegration: '#3b82f6',     // Blue 500
    configuration: '#6366f1',      // Indigo 500
  },
  
  styles: {
    glass: {
      background: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
      backdrop: 'blur(12px)',
    },
    
    elevation: {
      none: 'none',
      small: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      large: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      floating: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    
    borderRadius: {
      none: '0',
      small: '0.375rem',   // 6px
      medium: '0.5rem',    // 8px  
      large: '0.75rem',    // 12px
      full: '9999px',
    },
    
    typography: {
      fontFamily: {
        sans: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
        mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        display: '"Cal Sans", Inter, system-ui, sans-serif',
      },
      fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    
    spacing: {
      xs: '0.25rem',    // 4px
      sm: '0.5rem',     // 8px
      md: '1rem',       // 16px
      lg: '1.5rem',     // 24px
      xl: '2rem',       // 32px
      '2xl': '3rem',    // 48px
      '3xl': '4rem',    // 64px
      '4xl': '6rem',    // 96px
    },
    
    animation: {
      transition: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
};

// 🌙 GOVERNMENT DARK THEME - Sophisticated & Modern
export const governmentDarkTheme: ThemeColors & { styles: ThemeStyles } = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  surface: {
    background: '#0f172a',    // Slate 900
    paper: '#1e293b',        // Slate 800  
    elevated: '#334155',      // Slate 700
    glass: 'rgba(30, 41, 59, 0.85)',
    overlay: 'rgba(255, 255, 255, 0.05)',
  },
  
  text: {
    primary: '#f8fafc',      // Slate 50
    secondary: '#cbd5e1',     // Slate 300
    disabled: '#64748b',      // Slate 500
    inverse: '#0f172a',
  },
  
  semantic: {
    success: '#10b981',       // Emerald 500
    warning: '#f59e0b',       // Amber 500
    error: '#ef4444',         // Red 500
    info: '#3b82f6',          // Blue 500
  },
  
  agents: {
    dataArchitecture: '#a78bfa',   // Violet 400
    designSystem: '#f472b6',       // Pink 400
    monitoring: '#34d399',         // Emerald 400
    security: '#fbbf24',           // Amber 400
    apiIntegration: '#60a5fa',     // Blue 400
    configuration: '#818cf8',      // Indigo 400
  },
  
  styles: {
    glass: {
      background: 'rgba(30, 41, 59, 0.85)',
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      backdrop: 'blur(12px)',
    },
    
    elevation: {
      none: 'none',
      small: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
      large: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      floating: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
    },
    
    borderRadius: governmentLightTheme.styles.borderRadius,
    typography: governmentLightTheme.styles.typography,
    spacing: governmentLightTheme.styles.spacing,
    animation: governmentLightTheme.styles.animation,
  },
};

// 🎨 HIGH CONTRAST THEME - Maximum Accessibility
export const highContrastTheme: ThemeColors & { styles: ThemeStyles } = {
  primary: {
    50: '#ffffff',
    100: '#ffffff',
    200: '#ffffff',
    300: '#ffffff',
    400: '#ffffff',
    500: '#000000',
    600: '#000000',
    700: '#000000',
    800: '#000000',
    900: '#000000',
    950: '#000000',
  },
  
  surface: {
    background: '#ffffff',
    paper: '#ffffff',
    elevated: '#ffffff',
    glass: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.1)',
  },
  
  text: {
    primary: '#000000',
    secondary: '#000000',
    disabled: '#666666',
    inverse: '#ffffff',
  },
  
  semantic: {
    success: '#008000',
    warning: '#ff8c00',
    error: '#ff0000',
    info: '#0000ff',
  },
  
  agents: {
    dataArchitecture: '#4b0082',   // Indigo
    designSystem: '#dc143c',       // Crimson
    monitoring: '#228b22',         // Forest Green
    security: '#ff8c00',           // Dark Orange
    apiIntegration: '#0000cd',     // Medium Blue
    configuration: '#8b008b',      // Dark Magenta
  },
  
  styles: {
    glass: {
      background: '#ffffff',
      border: '#000000',
      shadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      backdrop: 'none',
    },
    
    elevation: {
      none: 'none',
      small: '0 2px 4px rgba(0, 0, 0, 0.5)',
      medium: '0 4px 8px rgba(0, 0, 0, 0.5)',
      large: '0 8px 16px rgba(0, 0, 0, 0.5)',
      floating: '0 12px 24px rgba(0, 0, 0, 0.5)',
    },
    
    borderRadius: {
      none: '0',
      small: '2px',
      medium: '4px',
      large: '6px',
      full: '9999px',
    },
    
    typography: {
      fontFamily: {
        sans: 'Arial, sans-serif',
        mono: 'Courier New, monospace',
        display: 'Arial, sans-serif',
      },
      fontSize: governmentLightTheme.styles.typography.fontSize,
      fontWeight: {
        light: 400,    // No light weight for accessibility
        normal: 400,
        medium: 700,   // Bold for better contrast
        semibold: 700,
        bold: 900,
      },
    },
    
    spacing: governmentLightTheme.styles.spacing,
    
    animation: {
      transition: {
        fast: '0ms',    // No animations for high contrast
        normal: '0ms',
        slow: '0ms',
      },
      easing: {
        easeInOut: 'linear',
        easeOut: 'linear',
        easeIn: 'linear',
        bounce: 'linear',
      },
    },
  },
};

// Theme registry for easy switching
export const themes = {
  'government-light': governmentLightTheme,
  'government-dark': governmentDarkTheme,
  'high-contrast': highContrastTheme,
} as const;

export type ThemeName = keyof typeof themes;

// CSS custom properties generator
export function generateCSSCustomProperties(theme: ThemeColors & { styles: ThemeStyles }): string {
  return `
    :root {
      /* Primary Colors */
      --eva-primary-50: ${theme.primary[50]};
      --eva-primary-100: ${theme.primary[100]};
      --eva-primary-500: ${theme.primary[500]};
      --eva-primary-600: ${theme.primary[600]};
      --eva-primary-700: ${theme.primary[700]};
      
      /* Surfaces */
      --eva-surface-background: ${theme.surface.background};
      --eva-surface-paper: ${theme.surface.paper};
      --eva-surface-elevated: ${theme.surface.elevated};
      --eva-surface-glass: ${theme.surface.glass};
      
      /* Text */
      --eva-text-primary: ${theme.text.primary};
      --eva-text-secondary: ${theme.text.secondary};
      --eva-text-disabled: ${theme.text.disabled};
      
      /* Glass Effects */
      --eva-glass-background: ${theme.styles.glass.background};
      --eva-glass-border: ${theme.styles.glass.border};
      --eva-glass-shadow: ${theme.styles.glass.shadow};
      --eva-glass-backdrop: ${theme.styles.glass.backdrop};
      
      /* Elevations */
      --eva-elevation-small: ${theme.styles.elevation.small};
      --eva-elevation-medium: ${theme.styles.elevation.medium};
      --eva-elevation-large: ${theme.styles.elevation.large};
      
      /* Border Radius */
      --eva-border-radius-medium: ${theme.styles.borderRadius.medium};
      --eva-border-radius-large: ${theme.styles.borderRadius.large};
      
      /* Typography */
      --eva-font-family-sans: ${theme.styles.typography.fontFamily.sans};
      --eva-font-size-base: ${theme.styles.typography.fontSize.base};
      --eva-font-size-lg: ${theme.styles.typography.fontSize.lg};
      --eva-font-size-xl: ${theme.styles.typography.fontSize.xl};
      
      /* Spacing */
      --eva-spacing-sm: ${theme.styles.spacing.sm};
      --eva-spacing-md: ${theme.styles.spacing.md};
      --eva-spacing-lg: ${theme.styles.spacing.lg};
      --eva-spacing-xl: ${theme.styles.spacing.xl};
      
      /* Transitions */
      --eva-transition-fast: ${theme.styles.animation.transition.fast};
      --eva-transition-normal: ${theme.styles.animation.transition.normal};
      
      /* Agent Colors */
      --eva-agent-data: ${theme.agents.dataArchitecture};
      --eva-agent-design: ${theme.agents.designSystem};
      --eva-agent-monitoring: ${theme.agents.monitoring};
      --eva-agent-security: ${theme.agents.security};
      --eva-agent-api: ${theme.agents.apiIntegration};
      --eva-agent-config: ${theme.agents.configuration};
    }
  `;
}