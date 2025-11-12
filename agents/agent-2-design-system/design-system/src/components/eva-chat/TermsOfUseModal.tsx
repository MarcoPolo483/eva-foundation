import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TermsAcceptance } from '../../hooks/useTermsOfUse';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onAccept: (acceptedTerms: TermsAcceptance) => void;
  onClose: () => void;
}

export function TermsOfUseModal({ isOpen, onAccept, onClose }: TermsOfUseModalProps) {
  const { t } = useTranslation();
  const [checkboxes, setCheckboxes] = useState({
    protectedBCompliance: false,
    dataCollection: false,
    termsAcceptance: false,
    courseRegistration: false
  });

  const isAcceptEnabled = Object.values(checkboxes).every(checked => checked);

  const handleCheckboxChange = (key: keyof typeof checkboxes) => {
    setCheckboxes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAccept = () => {
    if (isAcceptEnabled) {
      onAccept({
        ...checkboxes,
        version: '2024.1',
        acceptedAt: new Date().toISOString()
      });
    }
  };

  const handleViewFullTerms = () => {
    window.open('https://esdc.gc.ca/eva/terms', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('evaChatTerms.title', 'EVA Chat Terms of Use')}
            </h2>
            <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              FR
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"            aria-label={t('common.close', 'Close')}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            {t('evaChatTerms.instruction', 'Please review and accept the following terms to proceed.')}
          </p>

          {/* Main Terms List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-gray-600 mt-1">•</span>
              <p className="text-gray-700">
                {t('evaChatTerms.protectedBInfo', 'Ensure the information being used is not above ')}
                <span className="font-semibold text-red-600">Protected B</span>
                {t('evaChatTerms.stewardshipNote', ' and that as a steward of government information, you respect its use.')}
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-gray-600 mt-1">•</span>
              <p className="text-gray-700">
                {t('evaChatTerms.noReplaceExpertise', 'Do not use EVA to replace subject matter expertise.')}
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-gray-600 mt-1">•</span>
              <p className="text-gray-700">
                {t('evaChatTerms.reviewAccuracy', 'Review generated content for accuracy.')}
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-gray-600 mt-1">•</span>
              <p className="text-gray-700">
                {t('evaChatTerms.noAdminDecisions', 'Do not use EVA for administrative decisions impacting citizens\' benefits, rights, or personal data.')}
              </p>
            </div>
          </div>

          {/* View Full Terms Button */}
          <button
            onClick={handleViewFullTerms}
            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
          >
            {t('evaChatTerms.viewFullTerms', 'View Full Terms of Use')}
          </button>

          {/* Required Checkboxes */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm text-red-600 flex items-center gap-1">
              <span>*</span>
              <span>{t('evaChatTerms.requiredNote', 'Required fields')}</span>
            </div>

            {/* Protected B Compliance */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center">
                <span className="text-red-500 text-sm mr-1">*</span>
                <input
                  type="checkbox"
                  checked={checkboxes.protectedBCompliance}
                  onChange={() => handleCheckboxChange('protectedBCompliance')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                {t('evaChatTerms.protectedBCheckbox', 'I have read and understand the ')}
                <a 
                  href="https://esdc.gc.ca/eva/guidelines" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {t('evaChatTerms.dosAndDonts', 'Do\'s and Don\'ts')}
                </a>
                {t('evaChatTerms.protectedBCheckboxContinued', ' of using generative AI tools responsibly as well as the ')}
                <a 
                  href="https://tbs.gc.ca/ai-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {t('evaChatTerms.tbsPolicy', 'TBS policy and guide')}
                </a>
                {t('evaChatTerms.section3Reference', ' mentioned under Section 3 of the Terms of Use: Policies, Guidelines and Restrictions.')}
              </div>
            </label>

            {/* Data Collection */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center">
                <span className="text-red-500 text-sm mr-1">*</span>
                <input
                  type="checkbox"
                  checked={checkboxes.dataCollection}
                  onChange={() => handleCheckboxChange('dataCollection')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                {t('evaChatTerms.dataCollectionCheckbox', 'I understand that EVA Chat collects, uses and stores personal information for security monitoring and compliance. EVA Chat may also generate outputs based on personal information.')}
              </p>
            </label>

            {/* Terms Acceptance */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center">
                <span className="text-red-500 text-sm mr-1">*</span>
                <input
                  type="checkbox"
                  checked={checkboxes.termsAcceptance}
                  onChange={() => handleCheckboxChange('termsAcceptance')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                {t('evaChatTerms.termsAcceptanceCheckbox', 'I agree to the EVA Chat Terms of Use, including all ethical guidelines and restrictions, and that I will respect the ')}
                <span className="font-semibold text-red-600">Protected B</span>
                {t('evaChatTerms.protectedBLimitations', ' limitations of the information uploaded or provided to EVA.')}
              </p>
            </label>

            {/* Course Registration */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center">
                <span className="text-red-500 text-sm mr-1">*</span>
                <input
                  type="checkbox"
                  checked={checkboxes.courseRegistration}
                  onChange={() => handleCheckboxChange('courseRegistration')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                {t('evaChatTerms.courseRegistrationText', 'I understand the importance of registering for the ')}
                <a 
                  href="https://esdc.gc.ca/eva/training" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {t('evaChatTerms.courseTitle', 'ESDC Virtual Assistant (EVA) and Microsoft Copilot Chat course')}
                </a>
                .
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 border-t bg-gray-50">
          <button
            onClick={handleAccept}
            disabled={!isAcceptEnabled}
            className={`px-8 py-2 rounded-full font-medium transition-all ${
              isAcceptEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('evaChatTerms.accept', 'Accept')}
          </button>
        </div>
      </div>
    </div>
  );
}