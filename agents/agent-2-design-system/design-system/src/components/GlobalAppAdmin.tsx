// src/components/GlobalAppAdmin.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectId } from "../lib/evaClient";
import type { ApimConfig } from "../lib/apimConfig";
import { defaultLocalConfig, defaultAzureConfig } from "../lib/apimConfig";
import { loadRegistry, saveRegistry, STORE_KEY } from "../lib/projectRegistryStore";
import { REGISTRY } from "./ProjectRegistry";

interface ThemeConfig {
  primary: string;
  background: string;
  surface: string;
  baseFontPx: number;
}

interface RagIndexConfig {
  chunkingStrategy: string;
  chunkSizeTokens: number;
  overlapTokens: number;
  indexName: string;
}

interface RagRetrievalConfig {
  rankingStrategy: string;
  topK: number;
  citationStyle: string;
}

interface GuardrailConfig {
  piiRedaction: boolean;
  speculativeAnswers: boolean;
  blockedTopicsSummary: string;
}

interface SuggestedQuestion {
  en: string;
  fr: string;
}

interface RegistryEntry {
  id: ProjectId;
  label: string;
  domain: string;
  owner: string;
  costCentre: string;
  ragProfile: string;
  description: string;
  theme: ThemeConfig;
  ragIndex: RagIndexConfig;
  ragRetrieval: RagRetrievalConfig;
  guardrails: GuardrailConfig;
  suggestedQuestions: SuggestedQuestion[];
  apim: ApimConfig;
}

export function GlobalAppAdmin() {
  const { t } = useTranslation();
  
  // Load all registry entries
  const [allEntries, setAllEntries] = useState<RegistryEntry[]>(() =>
    loadRegistry<RegistryEntry>(REGISTRY)
  );
  
  // Find admin project
  const adminProject = allEntries.find(e => e.id === 'admin');
  
  // Draft state for editing
  const [draftAdmin, setDraftAdmin] = useState<RegistryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Active data (draft or original)
  const activeAdmin = draftAdmin ?? adminProject;
  const theme = activeAdmin?.theme ?? {
    primary: "#000000",
    background: "#ffffff",
    surface: "#ffffff",
    baseFontPx: 16
  };
  
  // Helper to update fields
  function updateField(field: keyof RegistryEntry, value: any) {
    if (!adminProject) return;
    const draft = draftAdmin ?? { ...adminProject };
    setDraftAdmin({ ...draft, [field]: value });
  }
  
  // Save changes
  function handleSave() {
    if (!draftAdmin || !adminProject) return;
    
    const updated = allEntries.map(e => 
      e.id === 'admin' ? draftAdmin : e
    );
    
    const ok = saveRegistry(updated);
    if (ok) {
      setAllEntries(updated);
      setDraftAdmin(null);
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('registry-updated'));
      alert("Global app configuration saved successfully.");
    } else {
      alert("Failed to save configuration. Check console for details.");
    }
  }
  
  // Cancel editing
  function handleCancel() {
    setDraftAdmin(null);
    setIsEditing(false);
  }
  
  // Start editing
  function handleEdit() {
    setIsEditing(true);
  }
  
  if (!adminProject) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          ⚠️ Critical Error: Admin project configuration not found. Please reset the registry.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Global Application Administration">
      {/* Header */}
      <header className="mb-4">
        <p className="text-xs text-gray-600 mb-1">
          EVA DA 2.0 demo – System Configuration
        </p>
        <h1 className="text-2xl font-semibold">
          {t("globalAdmin.title", "Global App Administration")}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t("globalAdmin.subtitle", "Configure system-level settings and protected parameters")}
        </p>
      </header>

      {/* Action Buttons */}
      <div className="mb-5 flex gap-2">
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white"
          >
            {t("globalAdmin.edit", "Edit Configuration")}
          </button>
        ) : (
          <>
            <button 
              onClick={handleSave}
              className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              {t("globalAdmin.save", "Save Changes")}
            </button>
            <button 
              onClick={handleCancel}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("globalAdmin.cancel", "Cancel")}
            </button>
          </>
        )}
      </div>

      {/* Configuration Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        
        {/* 1. Project Registry Configuration */}
        <div className="rounded border border-gray-200 bg-[var(--color-surface)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold">Project Registry Configuration</span>
            <span className="text-xs text-gray-500">🔒 Protected</span>
          </div>
          <div className="px-4 py-3">
            <form className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Project ID</label>
                <input
                  type="text"
                  value={activeAdmin.id}
                  disabled
                  className="mt-1 block w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">System ID (read-only)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Display Name</label>
                <input
                  type="text"
                  value={activeAdmin.label}
                  onChange={(e) => updateField("label", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Domain</label>
                <input
                  type="text"
                  value={activeAdmin.domain}
                  onChange={(e) => updateField("domain", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Owner</label>
                <input
                  type="text"
                  value={activeAdmin.owner}
                  onChange={(e) => updateField("owner", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Cost Centre</label>
                <input
                  type="text"
                  value={activeAdmin.costCentre}
                  onChange={(e) => updateField("costCentre", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Description</label>
                <textarea
                  value={activeAdmin.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </form>

            <p className="mt-4 text-xs text-gray-600">
              ℹ️ This configuration controls the Project Registry admin interface itself.
              Changes here affect system-level behavior.
            </p>
          </div>
        </div>

        {/* 2. System Theme */}
        <div className="rounded border border-gray-200 bg-[var(--color-surface)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold">System Theme</span>
            <span className="text-xs text-gray-500">Admin UI Colors</span>
          </div>
          <div className="px-4 py-3">
            <form className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Primary Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) => updateField("theme", { ...theme, primary: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 w-8 rounded cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={theme.primary}
                    onChange={(e) => updateField("theme", { ...theme, primary: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Background Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.background}
                    onChange={(e) => updateField("theme", { ...theme, background: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 w-8 rounded cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={theme.background}
                    onChange={(e) => updateField("theme", { ...theme, background: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Surface Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.surface}
                    onChange={(e) => updateField("theme", { ...theme, surface: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 w-8 rounded cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={theme.surface}
                    onChange={(e) => updateField("theme", { ...theme, surface: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Base Font Size (px)</label>
                <input
                  type="number"
                  min="12"
                  max="24"
                  value={theme.baseFontPx}
                  onChange={(e) => updateField("theme", { ...theme, baseFontPx: parseInt(e.target.value, 10) })}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            </form>

            <p className="mt-4 text-xs text-gray-600">
              These theme settings control the appearance of the Project Registry admin interface.
            </p>
          </div>
        </div>

        {/* 3. APIM Configuration */}
        <div className="rounded border border-gray-200 bg-[var(--color-surface)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold">APIM Configuration</span>
            <span className={`text-xs ${activeAdmin.apim.mode === 'azure' ? 'text-blue-600' : 'text-gray-500'}`}>
              {activeAdmin.apim.mode === 'azure' ? 'Azure APIM' : 'Local Mock'}
            </span>
          </div>
          <div className="px-4 py-3 text-sm">
            <form className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Mode</label>
                <select
                  value={activeAdmin.apim.mode}
                  onChange={(e) => {
                    const newMode = e.target.value as 'local' | 'azure';
                    const baseConfig = newMode === 'local' ? defaultLocalConfig : defaultAzureConfig;
                    updateField("apim", { 
                      ...activeAdmin.apim,
                      ...baseConfig,
                      features: activeAdmin.apim.features
                    });
                  }}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                >
                  <option value="local">Local Mock</option>
                  <option value="azure">Azure APIM</option>
                </select>
              </div>

              {activeAdmin.apim.mode === 'azure' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">API Endpoint</label>
                    <input
                      type="url"
                      value={activeAdmin.apim.apiEndpoint}
                      onChange={(e) => updateField("apim", { ...activeAdmin.apim, apiEndpoint: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                      placeholder="https://your-apim.azure-api.net"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Subscription Key</label>
                    <input
                      type="password"
                      value={activeAdmin.apim.subscriptionKey || ''}
                      onChange={(e) => updateField("apim", { ...activeAdmin.apim, subscriptionKey: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                      placeholder="Enter APIM key"
                    />
                  </div>
                </>
              )}
            </form>

            <p className="mt-4 text-xs text-gray-600">
              APIM configuration for the admin interface. Does not affect project-specific APIM settings.
            </p>
          </div>
        </div>

        {/* 4. Future Sections Placeholder */}
        <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Future Global Settings</h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Authentication & Authorization</li>
            <li>• Feature Flags</li>
            <li>• Monitoring & Telemetry</li>
            <li>• Rate Limiting</li>
            <li>• Backup & Recovery</li>
            <li>• Multi-tenancy Settings</li>
          </ul>
        </div>

      </div>

      {/* Warning Note */}
      <div className="mt-6 rounded border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Important:</strong> Changes to global app configuration affect system behavior.
          Always test changes in a non-production environment first.
        </p>
      </div>
    </section>
  );
}
