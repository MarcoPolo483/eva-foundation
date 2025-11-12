// EVA DA 2.0 Design System Demo
// Showcase all beautiful components in action!

import React, { useState } from 'react';
import { 
  GlassCard, 
  AgentDashboard, 
  Button,
  ResponsiveGrid,
  SearchInput,
  SelectDropdown
} from './BeautifulComponents';
import { ResponsiveLayout, AgentNavigation, DashboardHeader } from './ResponsiveLayout';
import { AccessibilityDashboard, AccessibleThemeToggle } from './AccessibilityComponents';

// 🎨 COMPLETE DESIGN SYSTEM DEMO
export const DesignSystemDemo: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('2');
  const [searchTerm, setSearchTerm] = useState('');

  const mockAgents = [
    { 
      id: '1', 
      name: 'Data Architecture Expert', 
      type: 'data' as const, 
      status: 'active' as const, 
      progress: 85,
      lastActivity: '2 minutes ago',
      tasksCompleted: 12,
      tasksTotal: 15,
      metrics: { cpu: 45, memory: 62, requests: 1247, uptime: '2d 14h' },
      icon: '🗃️'
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
      metrics: { cpu: 78, memory: 71, requests: 892, uptime: '1d 8h' },
      icon: '🎨'
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
      metrics: { cpu: 32, memory: 48, requests: 2156, uptime: '3d 2h' },
      icon: '📊'
    },
    { 
      id: '4', 
      name: 'Security Guardian', 
      type: 'security' as const, 
      status: 'idle' as const, 
      progress: 100,
      lastActivity: '1 hour ago',
      tasksCompleted: 25,
      tasksTotal: 25,
      metrics: { cpu: 15, memory: 38, requests: 456, uptime: '5d 12h' },
      icon: '🔒'
    },
    { 
      id: '5', 
      name: 'API Integration Expert', 
      type: 'api' as const, 
      status: 'working' as const, 
      progress: 73,
      lastActivity: '30 seconds ago',
      tasksCompleted: 11,
      tasksTotal: 15,
      metrics: { cpu: 68, memory: 84, requests: 3421, uptime: '1d 2h' },
      icon: '🔌'
    },
    { 
      id: '6', 
      name: 'Configuration Manager', 
      type: 'config' as const, 
      status: 'active' as const, 
      progress: 88,
      lastActivity: '10 minutes ago',
      tasksCompleted: 7,
      tasksTotal: 8,
      metrics: { cpu: 25, memory: 52, requests: 789, uptime: '4d 8h' },
      icon: '⚙️'
    }
  ];

  const currentAgent = mockAgents.find(agent => agent.id === selectedAgent);

  return (
    <ResponsiveLayout
      sidebar={
        <AgentNavigation 
          agents={mockAgents}
          currentAgent={selectedAgent}
          onAgentSelect={setSelectedAgent}
        />
      }
      header={
        <DashboardHeader 
          title={`🎨 ${currentAgent?.name || 'EVA DA 2.0'}`}
          subtitle="Beautiful, Accessible, Government-Compliant Design System"
          breadcrumbs={[
            { label: 'Dashboard' },
            { label: 'Design System' },
            { label: currentAgent?.name || 'Overview' }
          ]}
          actions={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AccessibleThemeToggle />
              <Button size="sm" variant="ghost">⚙️ Settings</Button>
              <Button size="sm" variant="primary">🚀 Deploy</Button>
            </div>
          }
        />
      }
    >
      <div style={{ padding: '0 0 24px 0' }}>
        {/* Welcome Section */}
        <GlassCard elevation="medium" className="mb-6">
          <div style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ 
                fontSize: '48px', 
                fontWeight: '700', 
                margin: '0 0 16px 0',
                background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ✨ EVA DA 2.0 Design System ✨
              </h1>
              <p style={{ 
                fontSize: '20px', 
                color: 'var(--eva-text-secondary)', 
                margin: '0 0 24px 0',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.6'
              }}>
                Beautiful, accessible, government-compliant UI components with stunning 
                glass morphism effects and smooth animations.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="primary" size="lg">🎨 Explore Components</Button>
                <Button variant="secondary" size="lg">📚 Documentation</Button>
                <Button variant="ghost" size="lg">♿ Accessibility</Button>
              </div>
            </div>

            {/* Feature Highlights */}
            <ResponsiveGrid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
              {[
                { icon: '💎', title: 'Glass Morphism', desc: 'Stunning translucent effects' },
                { icon: '♿', title: 'WCAG 2.1 AA', desc: 'Full accessibility compliance' },
                { icon: '📱', title: 'Mobile First', desc: 'Beautiful responsive design' },
                { icon: '🌙', title: 'Multi-Theme', desc: 'Light, dark & high contrast' }
              ].map((feature, index) => (
                <GlassCard key={index} elevation="small" hover>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{feature.icon}</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--eva-text-secondary)', margin: '0' }}>
                      {feature.desc}
                    </p>
                  </div>
                </GlassCard>
              ))}
            </ResponsiveGrid>
          </div>
        </GlassCard>

        {/* Agent Dashboard Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>
            🤖 Agent Dashboard
          </h2>
          <AgentDashboard 
            agents={mockAgents}
            onAgentSelect={setSelectedAgent}
          />
        </div>

        {/* Components Showcase */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>
            🎨 Component Showcase
          </h2>
          
          <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap="lg">
            {/* Form Components */}
            <GlassCard elevation="medium">
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                  📝 Form Components
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <SearchInput 
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                  <SelectDropdown
                    options={[
                      { value: 'all', label: 'All Agents' },
                      { value: 'active', label: 'Active Only' },
                      { value: 'working', label: 'Working' }
                    ]}
                    value="all"
                    onChange={() => {}}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button variant="primary" size="sm">Primary</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <Button variant="ghost" size="sm">Ghost</Button>
                    <Button variant="danger" size="sm">Danger</Button>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Agent Cards */}
            <GlassCard elevation="medium">
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                  🎪 Agent Color System
                </h3>
                <ResponsiveGrid columns={{ sm: 2, md: 3 }} gap="sm">
                  {(['data', 'design', 'monitoring', 'security', 'api', 'config'] as const).map(agent => (
                    <GlassCard key={agent} agent={agent} elevation="small" hover>
                      <div style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          {agent === 'data' ? '🗃️' : 
                           agent === 'design' ? '🎨' : 
                           agent === 'monitoring' ? '📊' : 
                           agent === 'security' ? '🔒' : 
                           agent === 'api' ? '🔌' : '⚙️'}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                          {agent}
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </ResponsiveGrid>
              </div>
            </GlassCard>
          </ResponsiveGrid>
        </div>

        {/* Accessibility Section */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>
            ♿ Accessibility Dashboard
          </h2>
          <AccessibilityDashboard />
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default DesignSystemDemo;
