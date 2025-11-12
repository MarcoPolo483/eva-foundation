import { useTranslation } from "react-i18next";
import type { ProjectId } from "../lib/evaClient";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { LanguageToggle } from "./LanguageToggle";

// Use project-controlled assets (moved into src/assets for bundling & hashing)
import gocLogo from "../assets/goc-logo.svg";
import evaLogo from "../assets/eva-logo.svg";

interface HeaderProps {
  projectId: ProjectId;
  onProjectChange: (id: ProjectId) => void;
  onClearChat?: () => void;
  onOpenAdjust?: () => void;
  onOpenInfo?: () => void;
}

export function Header({ projectId, onProjectChange, onClearChat, onOpenAdjust, onOpenInfo }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="shadow-sm">
      <div
        className="h-2"
        style={{ backgroundColor: "var(--color-accent)" }}
        aria-hidden="true"
      />
      <div className="bg-[var(--color-surface)]">
  <div className="mx-auto grid max-w-5xl grid-cols-3 items-center px-4 py-2">
          {/* Left: Government logo + title */}
          <div className="flex items-center gap-3">
            <img src={gocLogo} alt="Government of Canada" className="h-8 w-auto object-contain" />

            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                {t("appTitle")}
              </span>
              <span className="text-xs text-gray-500">
                EVA DA 2.0 demo – project-aware, bilingual, accessible
              </span>
            </div>
          </div>

          {/* Center: EVA logo */}
          <div className="flex justify-center">
            <img src={evaLogo} alt="EVA 2.0" className="h-14 w-auto object-contain" />
          </div>

          {/* Right: project + language + toolbar */}
          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-3">
              <ProjectSwitcher projectId={projectId} onProjectChange={onProjectChange} />
              <LanguageToggle />
            </div>

            {/* simple toolbar matching mockup: clear / adjust / info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() => onClearChat?.()}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                {t("toolbar.clearChat")}
              </button>
              <button
                onClick={() => onOpenAdjust?.()}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                {t("toolbar.adjust")}
              </button>
              <button
                onClick={() => onOpenInfo?.()}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                {t("toolbar.info")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
