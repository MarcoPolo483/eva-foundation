// EVA DA 2.0 Stunning UI Components
// Modern glass morphism with accessibility compliance
// Beautiful animations and micro-interactions

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 'small' | 'medium' | 'large' | 'floating';
  hover?: boolean;
  agent?: 'data' | 'design' | 'monitoring' | 'security' | 'api' | 'config';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  elevation = 'medium',
  hover = false,
  agent
}) => {
  const agentColorClass = agent ? `eva-agent-${agent}` : '';
  
  return (
    <motion.div
      className={`
        eva-glass-card
        eva-elevation-${elevation}
        ${agentColorClass}
        ${hover ? 'eva-hover-lift' : ''}
        ${className}
      `}
      whileHover={hover ? { 
        scale: 1.02, 
        boxShadow: 'var(--eva-elevation-floating)',
        transition: { duration: 0.2 }
      } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

interface AgentDashboardCardProps {
  agent: {
    id: string;
    name: string;
    type: 'data' | 'design' | 'monitoring' | 'security' | 'api' | 'config';
    status: 'active' | 'idle' | 'working' | 'error';
    progress: number;
    lastActivity: string;
    tasksCompleted: number;
    tasksTotal: number;
  };
  onSelect?: (agentId: string) => void;
}

export const AgentDashboardCard: React.FC<AgentDashboardCardProps> = ({ agent, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const statusColors = {
    active: 'text-green-500',
    idle: 'text-gray-400', 
    working: 'text-blue-500',
    error: 'text-red-500'
  };
  
  const statusIcons = {
    active: '🟢',
    idle: '⚪',
    working: '🔵', 
    error: '🔴'
  };

  return (
    <GlassCard 
      elevation="medium" 
      hover={true}
      agent={agent.type}
      className="eva-agent-card cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(agent.id)}
    >
      <div className="p-6">
        {/* Header with agent icon and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div 
              className={`eva-agent-icon eva-agent-${agent.type}`}
              animate={agent.status === 'working' ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: agent.status === 'working' ? Infinity : 0, ease: 'linear' }}
            >
              {getAgentIcon(agent.type)}
            </motion.div>
            <div>
              <h3 className="eva-heading-md font-semibold text-primary-900">
                {agent.name}
              </h3>
              <p className="eva-text-sm text-secondary-600">
                Agent {agent.id}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 ${statusColors[agent.status]}`}>
            <span className="eva-text-sm font-medium">
              {statusIcons[agent.status]} {agent.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Progress bar with animation */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="eva-text-sm font-medium text-primary-700">
              Progress
            </span>
            <span className="eva-text-sm text-secondary-600">
              {agent.tasksCompleted}/{agent.tasksTotal} tasks
            </span>
          </div>
          
          <div className="eva-progress-track">
            <motion.div 
              className={`eva-progress-fill eva-agent-${agent.type}`}
              initial={{ width: 0 }}
              animate={{ width: `${agent.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          
          <div className="text-right mt-1">
            <span className="eva-text-xs text-secondary-500">
              {agent.progress}% complete
            </span>
          </div>
        </div>
        
        {/* Activity timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="eva-text-sm font-medium text-primary-700">
              Last Activity
            </span>
            <span className="eva-text-sm text-secondary-600">
              {agent.lastActivity}
            </span>
          </div>
          
          {/* Real-time activity indicator */}
          <AnimatePresence>
            {agent.status === 'working' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 text-blue-600"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
                <span className="eva-text-xs font-medium">
                  Working on task...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Hover effects */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 pt-4 border-t border-glass-border"
            >
              <button className={`eva-button eva-button-primary eva-agent-${agent.type} w-full`}>
                View Details →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
};

// Beautiful Chat Interface Component
interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string;
    agent?: string;
    thinking?: boolean;
  };
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: isVisible ? 1 : 0, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`eva-chat-message ${isUser ? 'eva-chat-user' : 'eva-chat-assistant'}`}
    >
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          
          {/* Message bubble with glass morphism */}
          <GlassCard 
            className={`
              eva-message-bubble
              ${isUser ? 'eva-user-bubble' : 'eva-assistant-bubble'}
              ${isSystem ? 'eva-system-bubble' : ''}
            `}
            elevation="small"
          >
            <div className="p-4">
              {/* Agent indicator for assistant messages */}
              {!isUser && !isSystem && message.agent && (
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-glass-border">
                  <div className={`eva-agent-badge eva-agent-${getAgentType(message.agent)}`}>
                    {getAgentIcon(getAgentType(message.agent))}
                  </div>
                  <span className="eva-text-xs font-medium text-secondary-600">
                    {message.agent}
                  </span>
                </div>
              )}
              
              {/* Thinking indicator */}
              {message.thinking && (
                <motion.div 
                  className="flex items-center space-x-2 mb-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="flex space-x-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-primary-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ 
                          duration: 0.6, 
                          repeat: Infinity, 
                          delay: i * 0.2 
                        }}
                      />
                    ))}
                  </div>
                  <span className="eva-text-sm text-secondary-600">
                    Thinking...
                  </span>
                </motion.div>
              )}
              
              {/* Message content with typography */}
              <div className={`
                eva-message-content
                ${isUser ? 'text-white' : 'text-primary-900'}
              `}>
                {message.content}
              </div>
              
              {/* Timestamp */}
              <div className={`
                eva-message-timestamp mt-2 pt-2 border-t border-glass-border
                ${isUser ? 'text-blue-100' : 'text-secondary-500'}
              `}>
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Avatar */}
        <div className={`
          eva-avatar flex-shrink-0 
          ${isUser ? 'order-1 mr-3' : 'order-2 ml-3'}
        `}>
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isUser ? 'bg-primary-500 text-white' : 'bg-secondary-100 text-secondary-700'}
          `}>
            {isUser ? '👤' : '🤖'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Floating Action Button with ripple effect
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: string;
  label: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  color = 'primary',
  size = 'medium'
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    onClick();
  };
  
  return (
    <motion.button
      className={`eva-fab eva-fab-${color} eva-fab-${size}`}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={label}
    >
      <span className="eva-fab-icon">{icon}</span>
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="eva-fab-ripple"
          style={{ left: ripple.x, top: ripple.y }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </motion.button>
  );
};

// Helper functions
function getAgentIcon(type: string): string {
  const icons = {
    data: '🗄️',
    design: '🎨', 
    monitoring: '📊',
    security: '🔒',
    api: '🔗',
    config: '⚙️'
  };
  return icons[type as keyof typeof icons] || '🤖';
}

function getAgentType(agentName: string): string {
  // Map agent names to types
  const typeMap: Record<string, string> = {
    'Data Architecture Agent': 'data',
    'Design System Agent': 'design',
    'Monitoring Agent': 'monitoring',
    'Security Agent': 'security',
    'API Integration Agent': 'api',
    'Configuration Agent': 'config'
  };
  return typeMap[agentName] || 'data';
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString();
}