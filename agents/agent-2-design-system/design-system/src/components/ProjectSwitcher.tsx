import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectId } from "../lib/evaClient";
import { loadRegistry } from "../lib/projectRegistryStore";
import { REGISTRY } from "./ProjectRegistry";

interface RegistryEntry {
  id: ProjectId;
  label: string;
  [key: string]: any;
}

interface Props {
  projectId: ProjectId;
  onProjectChange: (id: ProjectId) => void;
}

export function ProjectSwitcher({ projectId, onProjectChange }: Props) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<RegistryEntry[]>([]);
  // Load projects from registry
  useEffect(() => {
    const loadProjects = () => {
      try {
        const registry = loadRegistry<RegistryEntry>(REGISTRY);
        console.log('[ProjectSwitcher] Loaded projects:', registry.map(p => p.id));
        setProjects(registry);
      } catch (error) {
        console.error('[ProjectSwitcher] Failed to load registry:', error);
      }
    };

    loadProjects();

    // Listen for registry updates
    const handleRegistryUpdate = () => {
      loadProjects();
    };

    window.addEventListener('registry-updated', handleRegistryUpdate);
    return () => window.removeEventListener('registry-updated', handleRegistryUpdate);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onProjectChange(e.target.value as ProjectId);
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <span>{t("projectSelector.label", "Project")}:</span>
      <select
        value={projectId}
        onChange={handleChange}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {t(`project.${project.id}`, project.label)}
          </option>
        ))}
      </select>
    </label>
  );
}
