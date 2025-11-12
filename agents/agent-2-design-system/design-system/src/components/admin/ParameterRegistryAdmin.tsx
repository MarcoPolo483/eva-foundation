import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Master Parameter Registry Interface
interface ParameterRegistryAdminProps {
  initialRegistry?: EnterpriseParameterRegistry;
  onSave: (registry: EnterpriseParameterRegistry) => Promise<void>;
  onValidate: (registry: EnterpriseParameterRegistry) => ValidationResult;
  readOnly?: boolean;
}

export function ParameterRegistryAdmin({ 
  initialRegistry, 
  onSave, 
  onValidate, 
  readOnly = false 
}: ParameterRegistryAdminProps) {
  const { t } = useTranslation();
  const [registry, setRegistry] = useState<EnterpriseParameterRegistry>(initialRegistry || getDefaultRegistry());
  const [activeSection, setActiveSection] = useState<string>('systemConfig');
  const [validationResults, setValidationResults] = useState<ValidationResult>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save draft changes every 30 seconds
  useEffect(() => {
    if (!isDirty) return;
    
    const timer = setTimeout(() => {
      saveDraft();
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [registry, isDirty]);

  const saveDraft = () => {
    localStorage.setItem('eva-admin-draft', JSON.stringify({
      registry,
      timestamp: new Date().toISOString()
    }));
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // Announce section change to screen readers
    const announcement = document.getElementById('section-announcement');
    if (announcement) {
      announcement.textContent = t('admin.sectionChanged', { section: t(`admin.sections.${sectionId}`) });
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const validation = onValidate(registry);
      setValidationResults(validation);
      
      if (validation.isValid) {
        await onSave(registry);
        setIsDirty(false);
        localStorage.removeItem('eva-admin-draft');
        
        // Success announcement for screen readers
        const announcement = document.getElementById('save-announcement');
        if (announcement) {
          announcement.textContent = t('admin.saveSuccess');
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="parameter-registry-admin" role="main" aria-labelledby="admin-title">
      {/* Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        <div id="section-announcement"></div>
        <div id="save-announcement"></div>
        <div id="validation-announcement"></div>
      </div>

      {/* Header */}
      <header className="admin-header">
        <h1 id="admin-title" className="admin-title">
          {t('admin.title', 'EVA Platform Parameter Registry')}
        </h1>
        
        <div className="admin-toolbar" role="toolbar" aria-label={t('admin.toolbar')}>
          {/* Search */}
          <div className="search-container">
            <label htmlFor="parameter-search" className="sr-only">
              {t('admin.searchParameters')}
            </label>
            <input
              id="parameter-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.searchPlaceholder', 'Search parameters...')}
              className="parameter-search"
              autoComplete="off"
            />
          </div>

          {/* Actions */}
          <div className="toolbar-actions">
            <button
              type="button"
              onClick={() => setRegistry(getDefaultRegistry())}
              className="btn btn-secondary"
              disabled={readOnly}
              title={t('admin.resetToDefaults')}
            >
              {t('admin.reset')}
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSubmitting || readOnly}
              className="btn btn-primary"
              aria-describedby="save-status"
            >
              {isSubmitting ? t('admin.saving') : t('admin.save')}
            </button>
            
            <div id="save-status" className="sr-only">
              {isDirty ? t('admin.hasUnsavedChanges') : t('admin.allChangesSaved')}
            </div>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        {/* Navigation Sidebar */}
        <nav className="admin-nav" role="navigation" aria-label={t('admin.sections')}>
          <ParameterSectionNav
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            validationResults={validationResults}
            searchTerm={searchTerm}
          />
        </nav>

        {/* Main Content Area */}
        <main className="admin-content">
          <div className="section-container" role="tabpanel" aria-labelledby={`tab-${activeSection}`}>
            {renderSection(activeSection, registry, setRegistry, validationResults, readOnly)}
          </div>
        </main>

        {/* Context Panel */}
        <aside className="admin-sidebar" role="complementary" aria-label={t('admin.contextPanel')}>
          <ParameterContextPanel
            activeSection={activeSection}
            registry={registry}
            validationResults={validationResults}
          />
        </aside>
      </div>
    </div>
  );
}

// Navigation Component with Accessibility
interface ParameterSectionNavProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  validationResults: ValidationResult;
  searchTerm: string;
}

function ParameterSectionNav({ 
  activeSection, 
  onSectionChange, 
  validationResults, 
  searchTerm 
}: ParameterSectionNavProps) {
  const { t } = useTranslation();

  const sections = [
    { id: 'systemConfig', icon: '⚙️', title: t('admin.sections.systemConfig') },
    { id: 'tenancyConfig', icon: '🏢', title: t('admin.sections.tenancyConfig') },
    { id: 'aiConfig', icon: '🤖', title: t('admin.sections.aiConfig') },
    { id: 'dataConfig', icon: '📊', title: t('admin.sections.dataConfig') },
    { id: 'accessibilityConfig', icon: '♿', title: t('admin.sections.accessibilityConfig') },
    { id: 'integrationConfig', icon: '🔗', title: t('admin.sections.integrationConfig') },
    { id: 'monitoringConfig', icon: '📈', title: t('admin.sections.monitoringConfig') },
    { id: 'agentConfig', icon: '🤵', title: t('admin.sections.agentConfig') }
  ];

  const filteredSections = searchTerm 
    ? sections.filter(section => 
        section.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sections;

  return (
    <ul className="section-nav" role="tablist">
      {filteredSections.map((section) => {
        const hasErrors = validationResults[section.id]?.errors?.length > 0;
        const hasWarnings = validationResults[section.id]?.warnings?.length > 0;
        
        return (
          <li key={section.id} role="none">
            <button
              type="button"
              role="tab"
              id={`tab-${section.id}`}
              aria-selected={activeSection === section.id}
              aria-controls={`panel-${section.id}`}
              onClick={() => onSectionChange(section.id)}
              className={`section-nav-item ${activeSection === section.id ? 'active' : ''}`}
              aria-describedby={`${section.id}-status`}
            >
              <span className="section-icon" aria-hidden="true">{section.icon}</span>
              <span className="section-title">{section.title}</span>
              
              {/* Validation Status Indicators */}
              {hasErrors && (
                <span 
                  className="status-indicator error" 
                  aria-label={t('admin.hasErrors')}
                  title={t('admin.hasErrors')}
                >
                  ❌
                </span>
              )}
              {hasWarnings && !hasErrors && (
                <span 
                  className="status-indicator warning"
                  aria-label={t('admin.hasWarnings')}
                  title={t('admin.hasWarnings')}
                >
                  ⚠️
                </span>
              )}
            </button>
            
            <div id={`${section.id}-status`} className="sr-only">
              {hasErrors && t('admin.sectionHasErrors', { count: validationResults[section.id]?.errors?.length })}
              {hasWarnings && t('admin.sectionHasWarnings', { count: validationResults[section.id]?.warnings?.length })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// System Configuration Section
function SystemConfigSection({ 
  config, 
  onChange, 
  validationResults, 
  readOnly 
}: ParameterSectionProps<SystemConfig>) {
  const { t } = useTranslation();

  return (
    <div className="config-section" role="group" aria-labelledby="system-config-title">
      <h2 id="system-config-title" className="section-title">
        {t('admin.systemConfig.title')}
      </h2>
      
      <div className="config-groups">
        {/* Platform Core Settings */}
        <fieldset className="config-group">
          <legend className="config-group-title">
            {t('admin.systemConfig.platformCore')}
          </legend>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="platform-version">
                {t('admin.systemConfig.version')} *
              </label>
              <input
                id="platform-version"
                type="text"
                value={config.platformCore.version}
                onChange={(e) => onChange({
                  ...config,
                  platformCore: { ...config.platformCore, version: e.target.value }
                })}
                disabled={readOnly}
                required
                aria-describedby="platform-version-help"
              />
              <div id="platform-version-help" className="field-help">
                {t('admin.systemConfig.versionHelp')}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="environment">
                {t('admin.systemConfig.environment')} *
              </label>
              <select
                id="environment"
                value={config.platformCore.environment}
                onChange={(e) => onChange({
                  ...config,
                  platformCore: { 
                    ...config.platformCore, 
                    environment: e.target.value as 'development' | 'staging' | 'production'
                  }
                })}
                disabled={readOnly}
                required
              >
                <option value="development">{t('admin.environments.development')}</option>
                <option value="staging">{t('admin.environments.staging')}</option>
                <option value="production">{t('admin.environments.production')}</option>
              </select>
            </div>

            <div className="form-field">
              <div className="checkbox-group">
                <input
                  id="maintenance-mode"
                  type="checkbox"
                  checked={config.platformCore.maintenanceMode}
                  onChange={(e) => onChange({
                    ...config,
                    platformCore: { ...config.platformCore, maintenanceMode: e.target.checked }
                  })}
                  disabled={readOnly}
                />
                <label htmlFor="maintenance-mode">
                  {t('admin.systemConfig.maintenanceMode')}
                </label>
              </div>
              <div className="field-help">
                {t('admin.systemConfig.maintenanceModeHelp')}
              </div>
            </div>
          </div>
        </fieldset>

        {/* Performance & Scaling Settings */}
        <fieldset className="config-group">
          <legend className="config-group-title">
            {t('admin.systemConfig.performance')}
          </legend>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="max-concurrent-users">
                {t('admin.systemConfig.maxConcurrentUsers')} *
              </label>
              <input
                id="max-concurrent-users"
                type="number"
                min="1"
                max="100000"
                value={config.performance.maxConcurrentUsers}
                onChange={(e) => onChange({
                  ...config,
                  performance: { 
                    ...config.performance, 
                    maxConcurrentUsers: parseInt(e.target.value) 
                  }
                })}
                disabled={readOnly}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="response-warning-threshold">
                {t('admin.systemConfig.responseWarningThreshold')}
              </label>
              <div className="input-group">
                <input
                  id="response-warning-threshold"
                  type="number"
                  min="100"
                  max="10000"
                  value={config.performance.responseTimeThresholds.warning}
                  onChange={(e) => onChange({
                    ...config,
                    performance: {
                      ...config.performance,
                      responseTimeThresholds: {
                        ...config.performance.responseTimeThresholds,
                        warning: parseInt(e.target.value)
                      }
                    }
                  })}
                  disabled={readOnly}
                />
                <span className="input-suffix">ms</span>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Feature Flags */}
        <fieldset className="config-group">
          <legend className="config-group-title">
            {t('admin.systemConfig.featureFlags')}
          </legend>
          
          <FeatureFlagsEditor
            flags={config.platformCore.featureFlags}
            onChange={(flags) => onChange({
              ...config,
              platformCore: { ...config.platformCore, featureFlags: flags }
            })}
            readOnly={readOnly}
          />
        </fieldset>
      </div>
    </div>
  );
}

// Accessibility Configuration Section (High Priority)
function AccessibilityConfigSection({ 
  config, 
  onChange, 
  validationResults, 
  readOnly 
}: ParameterSectionProps<AccessibilityConfig>) {
  const { t } = useTranslation();

  return (
    <div className="config-section" role="group" aria-labelledby="accessibility-config-title">
      <h2 id="accessibility-config-title" className="section-title">
        {t('admin.accessibilityConfig.title')}
      </h2>
      
      <div className="accessibility-priority-notice" role="alert">
        <strong>{t('admin.accessibilityConfig.priorityNotice')}</strong>
        <p>{t('admin.accessibilityConfig.priorityDescription')}</p>
      </div>

      <div className="config-groups">
        {/* WCAG Compliance */}
        <fieldset className="config-group">
          <legend className="config-group-title">
            {t('admin.accessibilityConfig.wcagCompliance')}
          </legend>
          
          <div className="form-grid">
            <div className="form-field">
              <fieldset>
                <legend>{t('admin.accessibilityConfig.wcagLevel')} *</legend>
                <div className="radio-group">
                  {['A', 'AA', 'AAA'].map((level) => (
                    <div key={level} className="radio-option">
                      <input
                        id={`wcag-level-${level}`}
                        type="radio"
                        name="wcag-level"
                        value={level}
                        checked={config.wcagCompliance.level === level}
                        onChange={(e) => onChange({
                          ...config,
                          wcagCompliance: { ...config.wcagCompliance, level: e.target.value as 'A' | 'AA' | 'AAA' }
                        })}
                        disabled={readOnly}
                        required
                      />
                      <label htmlFor={`wcag-level-${level}`}>
                        {t(`admin.accessibilityConfig.wcagLevel${level}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="form-field">
              <div className="checkbox-group">
                <input
                  id="automatic-testing"
                  type="checkbox"
                  checked={config.wcagCompliance.automaticTesting}
                  onChange={(e) => onChange({
                    ...config,
                    wcagCompliance: { ...config.wcagCompliance, automaticTesting: e.target.checked }
                  })}
                  disabled={readOnly}
                />
                <label htmlFor="automatic-testing">
                  {t('admin.accessibilityConfig.automaticTesting')}
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Screen Reader Support */}
        <fieldset className="config-group">
          <legend className="config-group-title">
            {t('admin.accessibilityConfig.screenReaderSupport')}
          </legend>
          
          <div className="checkbox-list">
            {[
              'ariaLabelsRequired',
              'descriptiveTextRequired', 
              'landmarkNavigation',
              'skipLinks'
            ].map((setting) => (
              <div key={setting} className="checkbox-group">
                <input
                  id={setting}
                  type="checkbox"
                  checked={config.screenReaderSupport[setting as keyof typeof config.screenReaderSupport]}
                  onChange={(e) => onChange({
                    ...config,
                    screenReaderSupport: { 
                      ...config.screenReaderSupport, 
                      [setting]: e.target.checked 
                    }
                  })}
                  disabled={readOnly}
                />
                <label htmlFor={setting}>
                  {t(`admin.accessibilityConfig.${setting}`)}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Color Contrast Settings */}
        <fieldset className="config-group">
          <legend className="config-group-title">
            {t('admin.accessibilityConfig.colorContrast')}
          </legend>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="contrast-ratio">
                {t('admin.accessibilityConfig.minimumContrastRatio')} *
              </label>
              <select
                id="contrast-ratio"
                value={config.visualDesign.colorContrast.minimumRatio}
                onChange={(e) => onChange({
                  ...config,
                  visualDesign: {
                    ...config.visualDesign,
                    colorContrast: {
                      ...config.visualDesign.colorContrast,
                      minimumRatio: parseFloat(e.target.value)
                    }
                  }
                })}
                disabled={readOnly}
                required
              >
                <option value="3">3:1 ({t('admin.accessibilityConfig.level18pt')})</option>
                <option value="4.5">4.5:1 ({t('admin.accessibilityConfig.levelAA')})</option>
                <option value="7">7:1 ({t('admin.accessibilityConfig.levelAAA')})</option>
              </select>
            </div>

            <div className="form-field">
              <div className="checkbox-group">
                <input
                  id="auto-contrast-check"
                  type="checkbox"
                  checked={config.visualDesign.colorContrast.autoCheck}
                  onChange={(e) => onChange({
                    ...config,
                    visualDesign: {
                      ...config.visualDesign,
                      colorContrast: {
                        ...config.visualDesign.colorContrast,
                        autoCheck: e.target.checked
                      }
                    }
                  })}
                  disabled={readOnly}
                />
                <label htmlFor="auto-contrast-check">
                  {t('admin.accessibilityConfig.autoContrastCheck')}
                </label>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}

// Feature Flags Editor Component
function FeatureFlagsEditor({ 
  flags, 
  onChange, 
  readOnly 
}: {
  flags: Record<string, boolean>;
  onChange: (flags: Record<string, boolean>) => void;
  readOnly: boolean;
}) {
  const { t } = useTranslation();
  const [newFlagName, setNewFlagName] = useState('');

  const addNewFlag = () => {
    if (newFlagName && !flags[newFlagName]) {
      onChange({
        ...flags,
        [newFlagName]: false
      });
      setNewFlagName('');
    }
  };

  const removeFlag = (flagName: string) => {
    const newFlags = { ...flags };
    delete newFlags[flagName];
    onChange(newFlags);
  };

  return (
    <div className="feature-flags-editor">
      {/* Add New Flag */}
      {!readOnly && (
        <div className="add-flag-section">
          <div className="input-group">
            <label htmlFor="new-flag-name" className="sr-only">
              {t('admin.featureFlags.newFlagName')}
            </label>
            <input
              id="new-flag-name"
              type="text"
              value={newFlagName}
              onChange={(e) => setNewFlagName(e.target.value)}
              placeholder={t('admin.featureFlags.enterFlagName')}
              onKeyPress={(e) => e.key === 'Enter' && addNewFlag()}
            />
            <button
              type="button"
              onClick={addNewFlag}
              disabled={!newFlagName || flags[newFlagName]}
              className="btn btn-secondary"
            >
              {t('admin.featureFlags.addFlag')}
            </button>
          </div>
        </div>
      )}

      {/* Existing Flags */}
      <div className="flags-list">
        {Object.entries(flags).map(([flagName, enabled]) => (
          <div key={flagName} className="flag-item">
            <div className="flag-control">
              <input
                id={`flag-${flagName}`}
                type="checkbox"
                checked={enabled}
                onChange={(e) => onChange({
                  ...flags,
                  [flagName]: e.target.checked
                })}
                disabled={readOnly}
              />
              <label htmlFor={`flag-${flagName}`} className="flag-label">
                <span className="flag-name">{flagName}</span>
                <span className={`flag-status ${enabled ? 'enabled' : 'disabled'}`}>
                  {enabled ? t('admin.featureFlags.enabled') : t('admin.featureFlags.disabled')}
                </span>
              </label>
            </div>
            
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeFlag(flagName)}
                className="btn btn-danger btn-sm"
                title={t('admin.featureFlags.removeFlag', { flag: flagName })}
              >
                {t('admin.remove')}
              </button>
            )}
          </div>
        ))}
      </div>

      {Object.keys(flags).length === 0 && (
        <div className="empty-state">
          <p>{t('admin.featureFlags.noFlags')}</p>
        </div>
      )}
    </div>
  );
}

// Context Panel Component
function ParameterContextPanel({ 
  activeSection, 
  registry, 
  validationResults 
}: {
  activeSection: string;
  registry: EnterpriseParameterRegistry;
  validationResults: ValidationResult;
}) {
  const { t } = useTranslation();

  return (
    <div className="context-panel">
      <h3 className="context-title">
        {t('admin.contextPanel.title')}
      </h3>

      {/* Section Documentation */}
      <div className="context-section">
        <h4>{t('admin.contextPanel.documentation')}</h4>
        <div className="context-content">
          {renderSectionDocumentation(activeSection)}
        </div>
      </div>

      {/* Validation Results */}
      {validationResults[activeSection] && (
        <div className="context-section">
          <h4>{t('admin.contextPanel.validation')}</h4>
          <ValidationResultsDisplay results={validationResults[activeSection]} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="context-section">
        <h4>{t('admin.contextPanel.quickActions')}</h4>
        <div className="quick-actions">
          <button type="button" className="btn btn-sm btn-secondary">
            {t('admin.exportSection')}
          </button>
          <button type="button" className="btn btn-sm btn-secondary">
            {t('admin.resetSection')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Validation Results Display
function ValidationResultsDisplay({ results }: { results: ValidationSectionResult }) {
  const { t } = useTranslation();

  if (!results.errors?.length && !results.warnings?.length) {
    return (
      <div className="validation-success">
        ✅ {t('admin.validation.allValid')}
      </div>
    );
  }

  return (
    <div className="validation-results">
      {results.errors?.map((error, index) => (
        <div key={index} className="validation-error" role="alert">
          ❌ {error.message}
        </div>
      ))}
      
      {results.warnings?.map((warning, index) => (
        <div key={index} className="validation-warning">
          ⚠️ {warning.message}
        </div>
      ))}
    </div>
  );
}

// Utility Functions
function getDefaultRegistry(): EnterpriseParameterRegistry {
  return {
    systemConfig: {
      platformCore: {
        version: '2.0.0',
        environment: 'development',
        maintenanceMode: false,
        debugLevel: 'info',
        featureFlags: {
          multiTenancy: true,
          advancedAnalytics: false,
          betaFeatures: false
        }
      },
      performance: {
        maxConcurrentUsers: 10000,
        responseTimeThresholds: {
          warning: 2000,
          critical: 5000
        },
        resourceLimits: {
          maxMemoryUsage: 8192,
          maxCPUUsage: 80,
          maxDiskUsage: 100
        },
        cachingSettings: {
          ttl: 3600,
          maxCacheSize: 1024,
          compressionEnabled: true
        }
      },
      security: {
        authenticationSettings: {
          tokenExpiry: 60,
          refreshTokenExpiry: 30,
          maxLoginAttempts: 5,
          lockoutDuration: 15
        },
        dataClassification: {
          defaultLevel: 'internal',
          autoClassificationEnabled: true,
          piiDetectionEnabled: true
        },
        encryptionSettings: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          keyRotationInterval: 90
        }
      }
    },
    // ... other default configurations
  } as EnterpriseParameterRegistry;
}

function renderSection(
  sectionId: string, 
  registry: EnterpriseParameterRegistry, 
  setRegistry: (registry: EnterpriseParameterRegistry) => void,
  validationResults: ValidationResult,
  readOnly: boolean
) {
  const commonProps = { validationResults, readOnly };

  switch (sectionId) {
    case 'systemConfig':
      return (
        <SystemConfigSection
          config={registry.systemConfig}
          onChange={(config) => setRegistry({ ...registry, systemConfig: config })}
          {...commonProps}
        />
      );
    
    case 'accessibilityConfig':
      return (
        <AccessibilityConfigSection
          config={registry.accessibilityConfig}
          onChange={(config) => setRegistry({ ...registry, accessibilityConfig: config })}
          {...commonProps}
        />
      );
    
    // Add other section renderers...
    default:
      return <div>Section under development: {sectionId}</div>;
  }
}

function renderSectionDocumentation(sectionId: string) {
  // Return contextual help documentation for each section
  return <div>Documentation for {sectionId}</div>;
}

// Type Definitions
interface ValidationResult {
  isValid?: boolean;
  [sectionId: string]: ValidationSectionResult | boolean | undefined;
}

interface ValidationSectionResult {
  errors?: Array<{ field: string; message: string; }>;
  warnings?: Array<{ field: string; message: string; }>;
}

interface ParameterSectionProps<T> {
  config: T;
  onChange: (config: T) => void;
  validationResults: ValidationResult;
  readOnly: boolean;
}

// Export types for use in other components
export type {
  EnterpriseParameterRegistry,
  ValidationResult,
  ParameterSectionProps
};