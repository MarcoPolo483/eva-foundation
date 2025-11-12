import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectId } from "../lib/evaClient";
import type { Message } from "../lib/types";
import { getRegistryById } from "./ProjectRegistry";

interface Props {
  projectId: ProjectId;
  messages: Message[];
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
}


export function ChatPanel({ projectId, messages, onSend, isSending }: Props) {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState("");  const taglineKey = `tagline.${projectId}`;
  
  // Load suggested questions from registry based on current language
  const currentLanguage = i18n.language as 'en' | 'fr';
  const registryById = getRegistryById(); // Get fresh data from localStorage
  const project = registryById[projectId];
  
  // Migration: Handle old string-based format (e.g., 'suggestions.AssistMe.q1')
  const rawQuestions = project?.suggestedQuestions ?? [];
  const migratedQuestions = rawQuestions.map(q => {
    // If it's already the new format { en, fr }, return as-is
    if (typeof q === 'object' && q !== null && ('en' in q || 'fr' in q)) {
      return q;
    }
    // If it's an old translation key string, try to translate it
    if (typeof q === 'string') {
      const enText = t(q, { lng: 'en', defaultValue: '' });
      const frText = t(q, { lng: 'fr', defaultValue: '' });
      // Only return if we got valid translations (not the key itself)
      if (enText && enText !== q) {
        return { en: enText, fr: frText };
      }
    }
    return null;
  }).filter((q): q is { en: string; fr: string } => q !== null);
  
  const suggestedQuestions = migratedQuestions
    .filter(q => q && (q.en || q.fr)) // Filter out empty/invalid questions
    .map((q) => q[currentLanguage] || q.en || q.fr) // Fallback: current lang -> English -> French
    .filter(Boolean); // Remove any null/undefined values

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");
    await onSend(trimmed);
  };

  // clear is handled by Header -> App

  const handleUseSuggestion = (text: string) => {
    setInput(text);
  };

  return (
    <section aria-label="Chat panel" className="space-y-4">
      {/* HERO CARD: title + toolbar + suggested questions */}
      <div className="rounded-lg border border-gray-200 bg-[var(--color-surface)] shadow-md px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <header>
            <h1 className="text-2xl font-semibold mb-1">
              {t(taglineKey)}
            </h1>
            <p className="text-sm text-gray-600">
              DEMO · Project-aware chat powered by EVA Foundation via APIM
            </p>
          </header>

          {/* Toolbar intentionally left to header for global actions */}
        </div>

        {/* Suggested questions (project-specific, theme-coloured boxes) */}
        {suggestedQuestions.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-3">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUseSuggestion(q)}
                  className="flex-1 min-w-[180px] rounded-lg bg-gray-100 px-4 py-4 text-sm text-left shadow-sm hover:shadow-md"
                  style={{
                    border: "1px solid transparent",
                    color: "var(--color-accent)"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CHAT CARD: log + input */}
      <div className="rounded-lg border border-gray-200 bg-[var(--color-surface)] shadow-sm p-3">
        <div
          role="log"
          aria-live="polite"
          className="mb-3 max-h-[50vh] overflow-y-auto rounded border border-gray-200 bg-white p-3 space-y-3"
        >
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">{t("chat.emptyHint")}</p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("input.label")}
            <textarea
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("input.placeholder")}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {isSending && (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {t("button.send")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
