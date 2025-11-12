import { useTranslation } from "react-i18next";
import type { RagTemplate } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  metadata?: { confidence?: number; sources?: string[]; processingTime?: number };
  template?: RagTemplate;
}

export function InfoPanel({ open, onClose, metadata, template }: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">{t('info.title')}</h3>

        <section className="mb-3">
          <h4 className="text-sm font-medium">{t('info.lastResponse')}</h4>
          {metadata ? (
            <ul className="text-sm list-disc ml-5 text-gray-700">
              <li>{t('info.confidence')}: {metadata.confidence}</li>
              <li>{t('info.processingTime')}: {metadata.processingTime} ms</li>
              <li>{t('info.sources')}: {metadata.sources?.join(', ') ?? '-'}</li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t('info.noResponse')}</p>
          )}
        </section>

        <section>
          <h4 className="text-sm font-medium">{t('info.activeTemplate')}</h4>
          <div className="text-sm text-gray-700">
            <div>temperature: {template?.temperature ?? '-'}</div>
            <div>top_k: {template?.top_k ?? '-'}</div>
            <div>source_filter: {template?.source_filter ?? '-'}</div>
          </div>
        </section>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded border">
            {t('button.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
