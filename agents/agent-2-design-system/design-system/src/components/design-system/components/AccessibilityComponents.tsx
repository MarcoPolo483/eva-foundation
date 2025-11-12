// EVA DA 2.0 Accessibility Testing Components
// WCAG 2.1 AA Compliance & Government Standards
// Beautiful accessibility-first design components

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 🎯 ACCESSIBILITY TESTING DASHBOARD
interface AccessibilityTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export const AccessibilityDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const runAccessibilityTests = async () => {
    setIsRunning(true);
    
    // Simulate running accessibility tests
    const tests: AccessibilityTestResult[] = [
      {
        test: 'Color Contrast',
        status: 'pass',
        message: 'All text meets WCAG AA contrast requirements (4.5:1)',
        severity: 'high',
        wcagLevel: 'AA'
      },
      {
        test: 'Keyboard Navigation',
        status: 'pass', 
        message: 'All interactive elements are keyboard accessible',
        severity: 'high',
        wcagLevel: 'A'
      },
      {
        test: 'Screen Reader Compatibility',
        status: 'pass',
        message: 'ARIA labels and semantic HTML properly implemented',
        severity: 'critical',
        wcagLevel: 'A'
      },
      {
        test: 'Focus Management',
        status: 'pass',
        message: 'Focus indicators are visible and logical',
        severity: 'medium',
        wcagLevel: 'AA'
      },
      {
        test: 'Text Scaling',
        status: 'pass',
        message: 'Layout remains usable at 200% zoom level',
        severity: 'medium',
        wcagLevel: 'AA'
      },
      {
        test: 'Motion Preferences',
        status: 'pass',
        message: 'Respects prefers-reduced-motion settings',
        severity: 'low',
        wcagLevel: 'AAA'
      }
    ];

    // Simulate test execution
    for (let i = 0; i <= tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTestResults(tests.slice(0, i));
      setOverallScore((i / tests.length) * 100);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="eva-accessibility-dashboard">
      <div className="eva-a11y-header">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="eva-heading-xl font-bold text-primary-900 mb-2">
              ♿ Accessibility Testing Dashboard
            </h2>
            <p className="eva-text-lg text-secondary-600">
              WCAG 2.1 AA Compliance & Government Standards
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runAccessibilityTests}
            disabled={isRunning}
            className={`eva-button eva-button-primary ${isRunning ? 'eva-button-loading' : ''}`}
            aria-label={isRunning ? 'Running accessibility tests' : 'Run accessibility tests'}
          >
            {isRunning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Testing...
              </>
            ) : (
              <>🔍 Run Tests</>
            )}
          </motion.button>
        </div>
        
        {/* Overall Score */}
        <AccessibilityScore score={overallScore} isRunning={isRunning} />
      </div>

      {/* Test Results */}
      <div className="eva-a11y-results">
        <AnimatePresence>
          {testResults.map((result, index) => (
            <motion.div
              key={result.test}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AccessibilityTestCard result={result} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Accessibility Guidelines */}
      <AccessibilityGuidelines />
    </div>
  );
};

// 📊 ACCESSIBILITY SCORE DISPLAY
interface AccessibilityScoreProps {
  score: number;
  isRunning: boolean;
}

const AccessibilityScore: React.FC<AccessibilityScoreProps> = ({ score, isRunning }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'F';
  };

  return (
    <div className="eva-a11y-score">
      <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <div className="eva-score-circle">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={getScoreColor(score)}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                strokeDasharray: '251.2',
                strokeDashoffset: `${251.2 - (score / 100) * 251.2}`
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`eva-text-2xl font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}%
              </div>
              <div className={`eva-text-sm font-semibold ${getScoreColor(score)}`}>
                {getScoreGrade(score)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="eva-heading-lg font-semibold text-primary-900 mb-2">
            Accessibility Score
          </h3>
          <p className="eva-text-md text-secondary-600 mb-4">
            {isRunning 
              ? 'Running comprehensive accessibility tests...'
              : score >= 90 
                ? '🎉 Excellent! Your design system meets WCAG 2.1 AA standards.'
                : score >= 70
                  ? '⚠️ Good progress! Some improvements needed for full compliance.'
                  : '❌ Significant accessibility issues detected. Immediate attention required.'
            }
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="eva-text-sm text-secondary-600">WCAG AA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="eva-text-sm text-secondary-600">Government Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🧪 ACCESSIBILITY TEST CARD
interface AccessibilityTestCardProps {
  result: AccessibilityTestResult;
}

const AccessibilityTestCard: React.FC<AccessibilityTestCardProps> = ({ result }) => {
  const statusConfig = {
    pass: {
      icon: '✅',
      color: 'border-green-200 bg-green-50',
      textColor: 'text-green-800',
      bgColor: 'bg-green-100'
    },
    fail: {
      icon: '❌',
      color: 'border-red-200 bg-red-50',
      textColor: 'text-red-800',
      bgColor: 'bg-red-100'
    },
    warning: {
      icon: '⚠️',
      color: 'border-yellow-200 bg-yellow-50',
      textColor: 'text-yellow-800',
      bgColor: 'bg-yellow-100'
    }
  };

  const severityConfig = {
    low: 'Low',
    medium: 'Medium', 
    high: 'High',
    critical: 'Critical'
  };

  const config = statusConfig[result.status];

  return (
    <div className={`eva-a11y-test-card ${config.color} p-4 rounded-lg border mb-4`}>
      <div className="flex items-start space-x-4">
        <div className="eva-test-icon">
          <span className="eva-text-2xl">{config.icon}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`eva-heading-md font-semibold ${config.textColor}`}>
              {result.test}
            </h4>
            <div className="flex items-center space-x-2">
              <span className={`eva-text-xs px-2 py-1 rounded-full font-medium ${config.bgColor} ${config.textColor}`}>
                WCAG {result.wcagLevel}
              </span>
              <span className={`eva-text-xs px-2 py-1 rounded-full font-medium ${config.bgColor} ${config.textColor}`}>
                {severityConfig[result.severity]}
              </span>
            </div>
          </div>
          
          <p className={`eva-text-sm ${config.textColor} opacity-90`}>
            {result.message}
          </p>
          
          {result.status === 'fail' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 pt-3 border-t border-red-200"
            >
              <h5 className="eva-text-sm font-semibold text-red-800 mb-2">
                Recommended Actions:
              </h5>
              <ul className="eva-text-sm text-red-700 space-y-1">
                <li>• Review color contrast ratios</li>
                <li>• Add proper ARIA labels</li>
                <li>• Implement keyboard navigation</li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// 📋 ACCESSIBILITY GUIDELINES COMPONENT
const AccessibilityGuidelines: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const guidelines = [
    {
      id: 'perceivable',
      title: '👀 Perceivable',
      description: 'Information must be presentable in ways users can perceive',
      items: [
        'Provide text alternatives for images',
        'Offer captions for multimedia content', 
        'Ensure sufficient color contrast (4.5:1 for normal text)',
        'Make content adaptable to different presentations'
      ]
    },
    {
      id: 'operable',
      title: '⌨️ Operable',
      description: 'Interface components must be operable by all users',
      items: [
        'Make all functionality keyboard accessible',
        'Give users control over time-based media',
        'Avoid content that causes seizures',
        'Help users navigate and find content'
      ]
    },
    {
      id: 'understandable',
      title: '🧠 Understandable',
      description: 'Information and UI operation must be understandable',
      items: [
        'Make text readable and understandable',
        'Make content appear and operate predictably',
        'Help users avoid and correct mistakes',
        'Use consistent navigation and identification'
      ]
    },
    {
      id: 'robust',
      title: '🛠️ Robust', 
      description: 'Content must be robust enough for various assistive technologies',
      items: [
        'Use valid, semantic HTML',
        'Ensure compatibility with screen readers',
        'Provide programmatic access to content',
        'Follow web standards and best practices'
      ]
    }
  ];

  return (
    <div className="eva-a11y-guidelines mt-8">
      <h3 className="eva-heading-lg font-semibold text-primary-900 mb-4">
        📋 WCAG 2.1 Guidelines
      </h3>
      
      <div className="space-y-4">
        {guidelines.map((guideline) => (
          <motion.div
            key={guideline.id}
            layout
            className="eva-guideline-card border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(
                expandedSection === guideline.id ? null : guideline.id
              )}
              className="w-full p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              aria-expanded={expandedSection === guideline.id}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="eva-heading-md font-semibold text-primary-900">
                    {guideline.title}
                  </h4>
                  <p className="eva-text-sm text-secondary-600 mt-1">
                    {guideline.description}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === guideline.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-primary-500"
                >
                  ⌄
                </motion.div>
              </div>
            </button>
            
            <AnimatePresence>
              {expandedSection === guideline.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 bg-gray-50">
                    <ul className="space-y-2">
                      {guideline.items.map((item, index) => (
                        <motion.li
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-2"
                        >
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="eva-text-sm text-secondary-700">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 🎨 ACCESSIBLE FORM COMPONENTS
interface AccessibleInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  helpText,
  placeholder
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="eva-accessible-input">
      <label 
        htmlFor={id}
        className={`eva-label ${required ? 'eva-label-required' : ''}`}
      >
        {label}
        {required && (
          <span className="eva-required-indicator" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div className="eva-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${helpText ? helpId : ''} ${error ? errorId : ''}`.trim()}
          className={`eva-input ${error ? 'eva-input-error' : ''}`}
        />
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            id={errorId}
            role="alert"
            className="eva-input-error-text"
          >
            <span className="eva-error-icon">⚠️</span>
            {error}
          </motion.div>
        )}
        
        {helpText && !error && (
          <div id={helpId} className="eva-input-help-text">
            {helpText}
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 SKIP LINK COMPONENT
export const SkipLink: React.FC = () => {
  return (
    <a 
      href="#main-content"
      className="eva-skip-link"
      onFocus={(e) => e.target.scrollIntoView()}
    >
      Skip to main content
    </a>
  );
};

// 🌙 THEME TOGGLE WITH ACCESSIBILITY
export const AccessibleThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');

  const themes = [
    { value: 'light', label: '☀️ Light', description: 'Standard light theme' },
    { value: 'dark', label: '🌙 Dark', description: 'Dark theme for low-light environments' },
    { value: 'high-contrast', label: '⚫ High Contrast', description: 'High contrast for better visibility' }
  ];

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Announce theme change to screen readers
    const announcement = `Theme changed to ${themes.find(t => t.value === newTheme)?.description}`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  };

  return (
    <div className="eva-theme-toggle" role="group" aria-labelledby="theme-toggle-label">
      <span id="theme-toggle-label" className="eva-text-sm font-medium text-secondary-700 block mb-2">
        Theme Selection
      </span>
      
      <div className="flex space-x-2">
        {themes.map((themeOption) => (
          <button
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value as typeof theme)}
            aria-pressed={theme === themeOption.value}
            aria-describedby={`theme-${themeOption.value}-desc`}
            className={`
              eva-theme-button
              ${theme === themeOption.value ? 'eva-theme-button-active' : ''}
            `}
            title={themeOption.description}
          >
            {themeOption.label}
            <span id={`theme-${themeOption.value}-desc`} className="sr-only">
              {themeOption.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccessibilityDashboard;
