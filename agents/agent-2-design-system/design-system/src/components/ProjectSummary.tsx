import { projectConfigs } from "../demoProjectConfig";
import type { ProjectId } from "../lib/evaClient";

interface Props {
  projectId: ProjectId;
}

export function ProjectSummary({ projectId }: Props) {
  const cfg = projectConfigs[projectId];

  if (!cfg) return null;

  return (
    <aside
      aria-label="Project configuration summary"
      className="rounded-lg border border-gray-200 bg-[var(--color-surface)] p-4 text-sm space-y-3"
    >
      <div>
        <h2 className="text-base font-semibold mb-1">{cfg.name}</h2>
        <p className="text-xs text-gray-500">
          Domain: {cfg.domain}
        </p>
      </div>

      <dl className="space-y-1">
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Owner</dt>
          <dd className="text-right">{cfg.owner}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Cost centre</dt>
          <dd className="text-right font-mono text-xs">{cfg.costCenter}</dd>
        </div>
        <div>
          <dt className="text-gray-500">RAG profile</dt>
          <dd>{cfg.ragProfile}</dd>
        </div>
      </dl>

      <p className="text-gray-700">
        {cfg.description}
      </p>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
          Golden questions
        </h3>
        <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {cfg.goldenQuestions.map((gq) => (
            <li key={gq.id} className="border border-gray-200 rounded px-2 py-1">
              <p className="font-medium">{gq.question}</p>
              <p className="text-xs text-gray-500 mt-1">
                Expected: {gq.expectedPattern}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-gray-400">
        Demo-only data – represents what would sit in the EVA DA project register
        for this project.
      </p>
    </aside>
  );
}
