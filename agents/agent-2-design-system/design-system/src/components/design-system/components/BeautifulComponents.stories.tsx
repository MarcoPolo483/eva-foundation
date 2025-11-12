// EVA DA 2.0 Storybook Stories
// Beautiful component documentation and testing

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { 
  GlassCard, 
  AgentDashboard,
  Button,
  SearchInput,
  AccessibilityDashboard 
} from '../BeautifulComponents';
import { ResponsiveLayout, AgentNavigation, DashboardHeader } from '../ResponsiveLayout';
import { AccessibleInput, AccessibleThemeToggle } from '../AccessibilityComponents';
import '../styles/eva-design-tokens.css';
import '../styles/beautiful-ui.css';
import '../styles/responsive-layout.css';
import '../styles/accessibility.css';

// 🎨 GLASS CARD STORIES
const meta: Meta<typeof GlassCard> = {
  title: 'EVA DA 2.0/Glass Card',
  component: GlassCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Beautiful glass morphism card with stunning visual effects and accessibility features.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    elevation: {
      control: 'select',
      options: ['small', 'medium', 'large', 'floating'],
      description: 'Shadow elevation level'
    },
    agent: {
      control: 'select', 
      options: ['data', 'design', 'monitoring', 'security', 'api', 'config'],
      description: 'Agent type for color theming'
    },
    hover: {
      control: 'boolean',
      description: 'Enable hover lift effect'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>
          🎨 Beautiful Glass Card
        </h3>
        <p style={{ margin: '0', color: '#64748b', lineHeight: '1.5' }}>
          This is a stunning glass morphism card with beautiful visual effects, 
          smooth animations, and full accessibility support.
        </p>
      </div>
    ),
    elevation: 'medium',
    hover: true
  }
};

export const AllAgentTypes: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '800px' }}>
      {(['data', 'design', 'monitoring', 'security', 'api', 'config'] as const).map(agent => (
        <GlassCard key={agent} agent={agent} elevation="medium" hover>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {agent === 'data' ? '🗃️' : 
               agent === 'design' ? '🎨' : 
               agent === 'monitoring' ? '📊' : 
               agent === 'security' ? '🔒' : 
               agent === 'api' ? '🔌' : '⚙️'}
            </div>
            <h4 style={{ margin: '0', textTransform: 'capitalize', fontSize: '14px', fontWeight: '600' }}>
              {agent} Agent
            </h4>
          </div>
        </GlassCard>
      ))}
    </div>
  )
};

// 🎯 BUTTON STORIES
const buttonMeta: Meta<typeof Button> = {
  title: 'EVA DA 2.0/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Beautiful, accessible button component with multiple variants and smooth animations.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger']
    },
    size: {
      control: 'select', 
      options: ['xs', 'sm', 'md', 'lg', 'xl']
    },
    loading: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    }
  }
};

export const ButtonDefault: StoryObj<typeof buttonMeta> = {
  args: {
    children: '✨ Beautiful Button',
    variant: 'primary',
    size: 'md',
    onClick: fn()
  }
};

export const ButtonVariants: StoryObj<typeof buttonMeta> = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  )
};

export const ButtonSizes: StoryObj<typeof buttonMeta> = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  )
};

export const ButtonLoading: StoryObj<typeof buttonMeta> = {
  args: {
    children: 'Processing...',
    loading: true,
    variant: 'primary'
  }
};

// 📱 RESPONSIVE LAYOUT STORIES
const layoutMeta: Meta<typeof ResponsiveLayout> = {
  title: 'EVA DA 2.0/Responsive Layout',
  component: ResponsiveLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Mobile-first responsive layout system with beautiful navigation and glass morphism effects.'
      }
    }
  },
  tags: ['autodocs']
};

const mockAgents = [
  { id: '1', name: 'Data Architecture', type: 'data' as const, status: 'active' as const, icon: '🗃️' },
  { id: '2', name: 'Design System', type: 'design' as const, status: 'working' as const, icon: '🎨' },
  { id: '3', name: 'Monitoring', type: 'monitoring' as const, status: 'active' as const, icon: '📊' },
  { id: '4', name: 'Security', type: 'security' as const, status: 'idle' as const, icon: '🔒' },
  { id: '5', name: 'API Integration', type: 'api' as const, status: 'working' as const, icon: '🔌' },
  { id: '6', name: 'Configuration', type: 'config' as const, status: 'active' as const, icon: '⚙️' }
];

export const LayoutDefault: StoryObj<typeof layoutMeta> = {
  render: () => (
    <ResponsiveLayout
      sidebar={
        <AgentNavigation 
          agents={mockAgents}
          currentAgent="2"
          onAgentSelect={(id) => console.log('Selected agent:', id)}
        />
      }
      header={
        <DashboardHeader 
          title="🤖 EVA DA 2.0 Dashboard"
          subtitle="Enterprise Virtual Assistant - Data Architecture Platform"
          breadcrumbs={[
            { label: 'Dashboard' },
            { label: 'Agents' },
            { label: 'Design System' }
          ]}
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="ghost">Settings</Button>
              <Button size="sm" variant="primary">Deploy</Button>
            </div>
          }
        />
      }
    >
      <div style={{ padding: '24px' }}>
        <GlassCard elevation="medium">
          <div style={{ padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Welcome to EVA DA 2.0! ✨
            </h2>
            <p style={{ margin: '0', lineHeight: '1.6', color: '#64748b' }}>
              This is the beautiful, responsive layout system with stunning glass morphism effects,
              mobile-first design, and full accessibility compliance. The sidebar navigation adapts
              perfectly to mobile devices with a smooth hamburger menu.
            </p>
          </div>
        </GlassCard>
      </div>
    </ResponsiveLayout>
  )
};

// 📊 AGENT DASHBOARD STORIES
const dashboardMeta: Meta<typeof AgentDashboard> = {
  title: 'EVA DA 2.0/Agent Dashboard',
  component: AgentDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive agent monitoring dashboard with real-time metrics, beautiful cards, and responsive design.'
      }
    }
  },
  tags: ['autodocs']
};

const mockDashboardAgents = [
  {
    id: '1',
    name: 'Data Architecture Expert',
    type: 'data' as const,
    status: 'active' as const,
    progress: 85,
    lastActivity: '2 minutes ago',
    tasksCompleted: 12,
    tasksTotal: 15,
    metrics: { cpu: 45, memory: 62, requests: 1247, uptime: '2d 14h' }
  },
  {
    id: '2', 
    name: 'Design System Expert',
    type: 'design' as const,
    status: 'working' as const,
    progress: 92,
    lastActivity: 'Just now',
    tasksCompleted: 18,
    tasksTotal: 20,
    metrics: { cpu: 78, memory: 71, requests: 892, uptime: '1d 8h' }
  },
  {
    id: '3',
    name: 'Monitoring Specialist', 
    type: 'monitoring' as const,
    status: 'active' as const,
    progress: 67,
    lastActivity: '5 minutes ago',
    tasksCompleted: 8,
    tasksTotal: 12,
    metrics: { cpu: 32, memory: 48, requests: 2156, uptime: '3d 2h' }
  }
];

export const DashboardDefault: StoryObj<typeof dashboardMeta> = {
  args: {
    agents: mockDashboardAgents,
    onAgentSelect: fn()
  }
};

// ♿ ACCESSIBILITY STORIES
const accessibilityMeta: Meta<typeof AccessibilityDashboard> = {
  title: 'EVA DA 2.0/Accessibility',
  component: AccessibilityDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive accessibility testing dashboard ensuring WCAG 2.1 AA compliance and government standards.'
      }
    }
  },
  tags: ['autodocs']
};

export const AccessibilityDefault: StoryObj<typeof accessibilityMeta> = {};

// 🎨 ACCESSIBLE INPUT STORIES  
const inputMeta: Meta<typeof AccessibleInput> = {
  title: 'EVA DA 2.0/Accessible Input',
  component: AccessibleInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Fully accessible input component with proper labeling, error handling, and WCAG compliance.'
      }
    }
  },
  tags: ['autodocs']
};

export const InputDefault: StoryObj<typeof inputMeta> = {
  args: {
    id: 'email',
    label: 'Email Address',
    value: '',
    onChange: fn(),
    type: 'email',
    placeholder: 'Enter your email address',
    helpText: 'We\'ll never share your email address'
  }
};

export const InputWithError: StoryObj<typeof inputMeta> = {
  args: {
    id: 'email-error',
    label: 'Email Address', 
    value: 'invalid-email',
    onChange: fn(),
    type: 'email',
    required: true,
    error: 'Please enter a valid email address'
  }
};

export const InputRequired: StoryObj<typeof inputMeta> = {
  args: {
    id: 'required-field',
    label: 'Full Name',
    value: '',
    onChange: fn(),
    required: true,
    helpText: 'Your first and last name'
  }
};

// 🌙 THEME TOGGLE STORIES
const themeMeta: Meta<typeof AccessibleThemeToggle> = {
  title: 'EVA DA 2.0/Theme Toggle',
  component: AccessibleThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Accessible theme toggle supporting light, dark, and high-contrast themes with proper ARIA announcements.'
      }
    }
  },
  tags: ['autodocs']
};

export const ThemeToggleDefault: StoryObj<typeof themeMeta> = {};

// 🎨 DESIGN TOKENS SHOWCASE
export const DesignTokens = {
  title: 'EVA DA 2.0/Design Tokens',
  render: () => (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
        🎨 EVA DA 2.0 Design Tokens
      </h2>
      
      {/* Color Palette */}
      <section style={{ marginBottom: '48px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
          Color Palette
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Data Architecture', color: '#a78bfa', agent: 'data' },
            { name: 'Design System', color: '#f472b6', agent: 'design' },
            { name: 'Monitoring', color: '#34d399', agent: 'monitoring' },
            { name: 'Security', color: '#fbbf24', agent: 'security' },
            { name: 'API Integration', color: '#60a5fa', agent: 'api' },
            { name: 'Configuration', color: '#818cf8', agent: 'config' }
          ].map(item => (
            <div key={item.name} style={{ textAlign: 'center' }}>
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: item.color,
                  borderRadius: '12px',
                  margin: '0 auto 8px auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }} 
              />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                {item.color}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Scale */}
      <section style={{ marginBottom: '48px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
          Typography Scale
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            { name: 'Heading 2XL', size: '36px', weight: '700' },
            { name: 'Heading XL', size: '30px', weight: '700' },
            { name: 'Heading LG', size: '24px', weight: '600' },
            { name: 'Heading MD', size: '20px', weight: '600' },
            { name: 'Text LG', size: '18px', weight: '400' },
            { name: 'Text Base', size: '16px', weight: '400' },
            { name: 'Text SM', size: '14px', weight: '400' },
            { name: 'Text XS', size: '12px', weight: '400' }
          ].map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ minWidth: '120px', fontSize: '12px', color: '#64748b' }}>
                {item.name}
              </div>
              <div style={{ 
                fontSize: item.size, 
                fontWeight: item.weight,
                lineHeight: '1.2'
              }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing System */}
      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
          Spacing System
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {[
            { name: 'XS', value: '4px' },
            { name: 'SM', value: '8px' },
            { name: 'MD', value: '16px' },
            { name: 'LG', value: '24px' },
            { name: 'XL', value: '32px' },
            { name: '2XL', value: '48px' }
          ].map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ minWidth: '60px', fontSize: '12px', color: '#64748b' }}>
                {item.name}
              </div>
              <div style={{ minWidth: '60px', fontSize: '12px', fontFamily: 'monospace' }}>
                {item.value}
              </div>
              <div 
                style={{ 
                  width: item.value,
                  height: '16px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px'
                }} 
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
};
