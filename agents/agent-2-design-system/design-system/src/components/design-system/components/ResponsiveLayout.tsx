// EVA DA 2.0 Responsive Layout System
// Beautiful mobile-first layouts for all 6 agents

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 📱 MOBILE-FIRST RESPONSIVE LAYOUT
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`eva-responsive-layout ${className}`}>
      {/* Mobile Header with Hamburger */}
      {isMobile && header && (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="eva-mobile-header"
        >
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="eva-hamburger-button"
              aria-label="Toggle navigation menu"
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ☰
              </motion.div>
            </button>
            {header}
          </div>
        </motion.header>
      )}

      <div className="eva-layout-container">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {isMobile && sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="eva-sidebar-overlay"
                />
              )}
            </AnimatePresence>

            {/* Sidebar Content */}
            <motion.aside
              initial={isMobile ? { x: -300 } : { x: 0 }}
              animate={{
                x: isMobile ? (sidebarOpen ? 0 : -300) : 0
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`eva-sidebar ${isMobile ? 'eva-sidebar-mobile' : 'eva-sidebar-desktop'}`}
            >
              {sidebar}
            </motion.aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="eva-main-content">
          {/* Desktop Header */}
          {!isMobile && header && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="eva-desktop-header"
            >
              {header}
            </motion.header>
          )}

          {/* Page Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="eva-page-content"
          >
            {children}
          </motion.div>

          {/* Footer */}
          {footer && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="eva-footer"
            >
              {footer}
            </motion.footer>
          )}
        </main>
      </div>
    </div>
  );
};

// 🎨 BEAUTIFUL AGENT NAVIGATION SIDEBAR
interface AgentNavigationProps {
  agents: Array<{
    id: string;
    name: string;
    type: 'data' | 'design' | 'monitoring' | 'security' | 'api' | 'config';
    status: 'active' | 'idle' | 'working' | 'error';
    icon: string;
  }>;
  currentAgent?: string;
  onAgentSelect?: (agentId: string) => void;
}

export const AgentNavigation: React.FC<AgentNavigationProps> = ({
  agents,
  currentAgent,
  onAgentSelect
}) => {
  return (
    <nav className="eva-agent-navigation">
      <div className="eva-nav-header">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="eva-logo"
        >
          🤖
        </motion.div>
        <h2 className="eva-nav-title">EVA DA 2.0</h2>
      </div>

      <div className="eva-nav-section">
        <h3 className="eva-nav-section-title">Agents</h3>
        <ul className="eva-nav-list">
          {agents.map((agent, index) => (
            <motion.li
              key={agent.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <AgentNavItem
                agent={agent}
                isActive={currentAgent === agent.id}
                onClick={() => onAgentSelect?.(agent.id)}
              />
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="eva-nav-footer">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="eva-system-status"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
            <span className="eva-text-xs text-secondary-600">
              System Operational
            </span>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

// 🎯 INDIVIDUAL AGENT NAVIGATION ITEM
interface AgentNavItemProps {
  agent: AgentNavigationProps['agents'][0];
  isActive: boolean;
  onClick: () => void;
}

const AgentNavItem: React.FC<AgentNavItemProps> = ({ agent, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-gray-400',
    working: 'bg-blue-500',
    error: 'bg-red-500'
  };

  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        eva-nav-item
        ${isActive ? 'eva-nav-item-active' : ''}
        eva-agent-${agent.type}
      `}
    >
      <div className="eva-nav-item-content">
        <div className="eva-nav-item-icon">
          <span className="eva-text-xl">{agent.icon}</span>
          <div className={`eva-status-dot ${statusColors[agent.status]}`} />
        </div>
        
        <div className="eva-nav-item-text">
          <span className="eva-nav-item-name">{agent.name}</span>
          <span className="eva-nav-item-status">{agent.status}</span>
        </div>
        
        <AnimatePresence>
          {(isActive || isHovered) && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="eva-nav-item-indicator"
            >
              →
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Active indicator line */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="eva-nav-active-line"
        />
      )}
    </motion.button>
  );
};

// 📊 BEAUTIFUL DASHBOARD HEADER
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs
}) => {
  return (
    <div className="eva-dashboard-header">
      {breadcrumbs && (
        <nav className="eva-breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="eva-breadcrumb-separator">→</span>
              )}
              <motion.span
                whileHover={crumb.href ? { scale: 1.05 } : {}}
                className={`eva-breadcrumb ${crumb.href ? 'eva-breadcrumb-link' : ''}`}
              >
                {crumb.label}
              </motion.span>
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="eva-header-content">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="eva-header-title"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="eva-header-subtitle"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        
        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="eva-header-actions"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 📱 MOBILE-FIRST CARD GRID
interface CardGridProps {
  children: React.ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}) => {
  return (
    <div className={`
      eva-card-grid
      eva-gap-${gap}
      eva-cols-mobile-${columns.mobile}
      eva-cols-tablet-${columns.tablet}
      eva-cols-desktop-${columns.desktop}
      ${className}
    `}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="eva-card-grid-item"
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// 🎨 BEAUTIFUL FOOTER
export const DashboardFooter: React.FC = () => {
  return (
    <footer className="eva-dashboard-footer">
      <div className="eva-footer-content">
        <div className="eva-footer-section">
          <h4 className="eva-footer-title">EVA DA 2.0</h4>
          <p className="eva-footer-description">
            Enterprise Virtual Assistant - Data Architecture Platform
          </p>
        </div>
        
        <div className="eva-footer-section">
          <h4 className="eva-footer-title">Agents</h4>
          <ul className="eva-footer-links">
            <li>🗃️ Data Architecture</li>
            <li>🎨 Design System</li>
            <li>📊 Monitoring</li>
            <li>🔒 Security</li>
            <li>🔌 API Integration</li>
            <li>⚙️ Configuration</li>
          </ul>
        </div>
        
        <div className="eva-footer-section">
          <h4 className="eva-footer-title">Status</h4>
          <div className="eva-system-metrics">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="eva-text-sm text-green-600">All Systems Operational</span>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="eva-footer-bottom">
        <p className="eva-text-sm text-secondary-600">
          © 2025 EVA DA 2.0 - Beautiful Enterprise Software
        </p>
        <div className="eva-footer-version">
          <span className="eva-text-xs text-secondary-500">v2.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default ResponsiveLayout;
