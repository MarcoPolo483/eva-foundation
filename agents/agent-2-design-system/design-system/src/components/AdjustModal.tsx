import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { RagTemplate } from "../lib/types";

interface Props {
  open: boolean;
  value: RagTemplate;
  onClose: () => void;
  onSave: (v: RagTemplate) => void;
}

export function AdjustModal({ open, value, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<RagTemplate>(value ?? {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded bg-white p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">{t("adjust.title")}</h2>

        <label className="block text-sm">
          <span className="text-xs text-gray-600">{t("adjust.temperature")}</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={local.temperature ?? 0.2}
            onChange={(e) => setLocal({ ...local, temperature: Number(e.target.value) })}
            className="mt-1 block w-full rounded border px-2 py-1"
          />
        </label>

        <label className="block text-sm mt-2">
          <span className="text-xs text-gray-600">{t("adjust.topK")}</span>
          <input
            type="number"
            min={0}
            step={1}
            value={local.top_k ?? 5}
            onChange={(e) => setLocal({ ...local, top_k: Number(e.target.value) })}
            className="mt-1 block w-full rounded border px-2 py-1"
          />
        </label>

        <label className="block text-sm mt-2">
          <span className="text-xs text-gray-600">{t("adjust.sourceFilter")}</span>
          <input
            type="text"
            value={local.source_filter ?? ""}
            onChange={(e) => setLocal({ ...local, source_filter: e.target.value })}
            className="mt-1 block w-full rounded border px-2 py-1"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">
            {t("button.cancel")}
          </button>
          <button
            onClick={() => {
              onSave(local);
              onClose();
            }}
            className="px-3 py-1 rounded bg-[var(--color-accent)] text-white"
          >
            {t("button.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
