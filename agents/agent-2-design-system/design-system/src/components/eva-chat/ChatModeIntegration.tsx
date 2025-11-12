
import { useTranslation } from 'react-i18next';
import { TermsOfUseModal } from './TermsOfUseModal';
import { useTermsOfUse } from '../../hooks/useTermsOfUse';

interface ChatModeToggleProps {
  mode: 'work' | 'generative';
  onModeChange: (mode: 'work' | 'generative') => void;
  projectId?: string;
  disabled?: boolean;
}

export function ChatModeToggle({ mode, onModeChange, projectId, disabled }: ChatModeToggleProps) {
  const { t } = useTranslation();
  const { 
    termsAccepted, 
    showTermsModal, 
    setShowTermsModal, 
    handleTermsAccept, 
    requireTermsAcceptance 
  } = useTermsOfUse();

  const handleModeChange = (newMode: 'work' | 'generative') => {
    if (newMode === 'generative') {
      // Check if Terms of Use are accepted for Generative mode
      if (!requireTermsAcceptance()) {
        return; // Modal will be shown by the hook
      }
    }
    onModeChange(newMode);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          {t('chatMode.label', 'Mode:')}
        </span>
        
        <div className="flex bg-white rounded-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => handleModeChange('work')}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'work'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            🔵 {t('chatMode.workOnly', 'Work Only')}
          </button>
          
          <button
            onClick={() => handleModeChange('generative')}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              mode === 'generative'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            ⚪ {t('chatMode.generative', 'Generative')}
            {!termsAccepted && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {mode === 'work' && projectId && (
          <span className="text-xs text-gray-500">
            ({t('chatMode.workModeDesc', 'Grounded in {{project}} data', { project: projectId })})
          </span>
        )}
        
        {mode === 'generative' && (
          <span className="text-xs text-gray-500">
            ({t('chatMode.generativeModeDesc', 'General AI - No RAG')})
          </span>
        )}
      </div>

      <TermsOfUseModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onClose={() => setShowTermsModal(false)}
      />
    </>
  );
}

// Suggested prompts based on mode
interface SuggestedPromptsProps {
  mode: 'work' | 'generative';
  projectId?: string;
  onPromptSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ mode, projectId, onPromptSelect }: SuggestedPromptsProps) {
  const { t } = useTranslation();

  // Different suggestions based on mode and project
  const getPrompts = () => {
    if (mode === 'work' && projectId) {
      // Project-specific suggestions (from screenshot analysis)
      if (projectId === 'jurisprudence' || projectId === 'assistMe') {
        return [
          t('prompts.work.ei', 'I have worked 275 hours, do I qualify for EI?'),
          t('prompts.work.oas', 'I live in Quebec, I\'m 67 years old and single. Do I qualify for OAS?'),
          t('prompts.work.passport', 'My daughter applied for a passport, can I pick up the passport for her?')
        ];
      }
      return [
        t('prompts.work.generic1', 'Summarize recent policy changes in this domain'),
        t('prompts.work.generic2', 'What are the eligibility criteria for...'),
        t('prompts.work.generic3', 'Compare current vs previous regulations')
      ];
    } else {
      // Generative mode suggestions (from EVA Chat screenshot)
      return [
        t('prompts.generative.summarize', 'Summarize policy documents with AI'),
        t('prompts.generative.email', 'Draft email reminding about project deadline'),
        t('prompts.generative.regulations', 'Understand regulations - give me tips')
      ];
    }
  };

  const prompts = getPrompts();

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-600">💡</span>
        <span className="text-sm text-gray-600">
          {t('prompts.suggested', 'Suggested')}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt)}
            className="p-3 text-left text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Classification warning (from screenshot)
interface ClassificationWarningProps {
  mode: 'work' | 'generative';
}

export function ClassificationWarning({ mode }: ClassificationWarningProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-yellow-800">
        <span>⚠️</span>
        <span className="font-medium">
          {mode === 'generative' 
            ? t('warning.generative', 'LLMs can make mistakes. Verify important information. Classification restricted up to Protected B.')
            : t('warning.work', 'Information Assistant uses AI. Check for mistakes. Transparency Note available.')
          }
        </span>
      </div>
    </div>
  );
}