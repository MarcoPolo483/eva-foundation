// src/components/AppAdmin.tsx
import { useState, useEffect } from "react";
import { loadAppConfig, saveAppConfig, DEFAULT_APP_CONFIG, exportAppConfig, importAppConfig } from "../lib/config/appConfigStore";
import type { AppConfig } from "../lib/config/appConfigStore";

export function AppAdmin() {
  const [cfg, setCfg] = useState<AppConfig>(() => loadAppConfig());
  const [json, setJson] = useState("");

  useEffect(() => {
    setCfg(loadAppConfig());
  }, []);

  function update<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    const next = { ...cfg, [key]: value } as AppConfig;
    setCfg(next);
  }

  function handleSave() {
    const ok = saveAppConfig(cfg);
    // eslint-disable-next-line no-alert
    alert(ok ? "App config saved to localStorage." : "Failed to save app config.");
  }

  function handleExport() {
    setJson(exportAppConfig(cfg));
  }

  function handleImport() {
    const parsed = importAppConfig(json);
    if (!parsed) {
      // eslint-disable-next-line no-alert
      alert("Invalid JSON payload. Import failed.");
      return;
    }
    setCfg(parsed);
    saveAppConfig(parsed);
    // eslint-disable-next-line no-alert
    alert("App config imported and saved.");
  }

  return (
    <section aria-label="App administration">
      <header className="mb-4">
        <h2 className="text-xl font-semibold">App (AI CoE) Administration</h2>
        <p className="text-sm text-gray-600">Global settings and defaults for the EVA demo.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-gray-200 bg-[var(--color-surface)] p-4">
          <h3 className="font-medium">Localization</h3>
          <div className="mt-2">
            <label className="block text-sm text-gray-600">Default language</label>
            <select value={cfg.defaultLanguage} onChange={(e) => update("defaultLanguage", e.target.value)} className="mt-1 rounded border border-gray-300 px-3 py-1 text-sm">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cfg.allowProjectThemeOverride} onChange={(e) => update("allowProjectThemeOverride", e.target.checked)} />
              Allow projects to override theme
            </label>
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-[var(--color-surface)] p-4">
          <h3 className="font-medium">Mock APIM defaults</h3>
          <div className="mt-2">
            <label className="block text-sm text-gray-600">Mode</label>
            <select value={cfg.mockApimDefault.mode} onChange={(e) => update("mockApimDefault", { ...cfg.mockApimDefault, mode: e.target.value as any })} className="mt-1 rounded border border-gray-300 px-3 py-1 text-sm">
              <option value="local">Local</option>
              <option value="azure">Azure</option>
            </select>
          </div>
          <div className="mt-2">
            <label className="block text-sm text-gray-600">Local Port</label>
            <input type="number" value={cfg.mockApimDefault.localPort ?? 7071} onChange={(e) => update("mockApimDefault", { ...cfg.mockApimDefault, localPort: parseInt(e.target.value, 10) })} className="mt-1 rounded border border-gray-300 px-3 py-1 text-sm" />
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-[var(--color-surface)] p-4 md:col-span-2">
          <h3 className="font-medium">Design System</h3>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Base font size</label>
              <input type="number" value={cfg.designSystem.baseFontPx} onChange={(e) => update("designSystem", { ...cfg.designSystem, baseFontPx: parseInt(e.target.value, 10) })} className="mt-1 rounded border border-gray-300 px-3 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Spacing scale</label>
              <input type="number" value={cfg.designSystem.spacingScale} onChange={(e) => update("designSystem", { ...cfg.designSystem, spacingScale: parseInt(e.target.value, 10) })} className="mt-1 rounded border border-gray-300 px-3 py-1 text-sm" />
            </div>
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-[var(--color-surface)] p-4 md:col-span-2">
          <div className="flex gap-2">
            <button onClick={handleSave} className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white">Save</button>
            <button onClick={() => { setCfg(DEFAULT_APP_CONFIG); saveAppConfig(DEFAULT_APP_CONFIG); }} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">Reset to defaults</button>
            <button onClick={handleExport} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">Export JSON</button>
          </div>

          {json && (
            <div className="mt-3">
              <label className="block text-xs text-gray-500">Exported JSON</label>
              <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={6} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-xs" />
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs text-gray-500">Import JSON</label>
            <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={6} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-xs" />
            <div className="mt-2">
              <button onClick={handleImport} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">Import</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
