// src/components/ProjectShell.tsx
import React from 'react';
import type { Project } from '../lib/types';

interface Props {
  project: Project;
  onBackToRegistry: () => void;
}

export const ProjectShell: React.FC<Props> = ({ project, onBackToRegistry }) => {
  const theme = project.lookAndFeel ?? {
    headingScale: { h1: 1.6, h2: 1.3, h3: 1.1 },
    logoUrl: "",
    showLanguageToggle: false,
    showHelpLink: false,
    helpLinkUrl: ""
  };

  const ragIndex = project.ragIndexConfig ?? { chunkingStrategy: '', chunkSizeTokens: 0, chunkOverlapTokens: 0 };
  const ragRetrieval = project.ragRetrievalConfig ?? { rankingStrategy: '', topK: 0 };
  const ragGuardrail = project.ragGuardrailConfig ?? { piiRedactionEnabled: false, allowSpeculativeAnswers: false };
  const goldenCount = project.goldenQuestionSet?.length ?? 0;

  // Title based on project slug / name – you can later move this into data
  let assistantTitle = 'Chat with your work data';

  if (project.slug?.includes('jurisprudence')) {
    assistantTitle = 'Chat with your Jurisprudence Research Assistant';
  } else if (project.slug.includes('canada-life')) {
    assistantTitle = 'Chat with your Canada Life Benefits Assistant';
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--eva-bg)',
        color: '#111',
        fontSize: 'var(--eva-font-size-base)'
      }}
    >
      {/* Top nav / header bar */}
      <header
        style={{
          backgroundColor: 'var(--eva-nav)',
          color: 'var(--eva-nav-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBackToRegistry}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'inherit',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: '0.85em',
              cursor: 'pointer'
            }}
          >
            ← Project Register
          </button>

          {theme.logoUrl && (
            <img
              src={theme.logoUrl}
              alt=""
              style={{ height: 24, width: 'auto' }}
            />
          )}

          <span style={{ fontWeight: 600 }}>{project.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language toggle */}
          {theme.showLanguageToggle && (
            <div style={{ fontSize: '0.9em' }}>
              <button
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'inherit',
                  padding: '4px 8px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  marginRight: 4
                }}
              >
                EN
              </button>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  padding: '4px 8px',
                  borderRadius: 999,
                  cursor: 'pointer'
                }}
              >
                FR
              </button>
            </div>
          )}

          {theme.showHelpLink && theme.helpLinkUrl && (
            <a
              href={theme.helpLinkUrl}
              style={{
                fontSize: '0.9em',
                color: 'inherit',
                textDecoration: 'underline'
              }}
            >
              Help
            </a>
          )}
        </div>
      </header>

      {/* Tagline + banner (matches slide look) */}
      <div
        style={{
          backgroundColor: 'var(--eva-banner)',
          color: 'var(--eva-banner-text)',
          padding: '18px 32px 24px 32px'
        }}
      >
        <div
          style={{
            fontSize: '0.85em',
            opacity: 0.9,
            marginBottom: 4
          }}
        >
          EVA DA 2.0 demo – project-aware, bilingual, accessible
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: `calc(var(--eva-font-size-base) * ${theme.headingScale?.h1 ?? 1.6})`
          }}
        >
          {assistantTitle}
        </h1>
        <div
          style={{
            marginTop: 4,
            fontSize: `calc(var(--eva-font-size-base) * 0.95)`,
            opacity: 0.95
          }}
        >
          EVA Domain Assistant
        </div>
      </div>

      {/* Main content: chat + configuration */}
      <main
        style={{
          padding: '24px 32px 32px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          alignItems: 'flex-start'
        }}
      >
        {/* Chat panel */}
        <section
          style={{
            backgroundColor: 'var(--eva-surface)',
            borderRadius: 'var(--eva-radius)',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: `calc(var(--eva-font-size-base) * ${theme.headingScale?.h2 ?? 1.3})`
            }}
          >
            Chat
          </h2>

          <div
            style={{
              borderRadius: 'var(--eva-radius)',
              border: '1px solid #ddd',
              padding: '12px',
              minHeight: 220,
              marginBottom: 12,
              backgroundColor: '#fafafa'
            }}
          >
            <p style={{ color: '#777', fontSize: '0.95em', marginTop: 0 }}>
              This is where your conversation with the {project.name} assistant will appear.
              The answers are powered by the shared EVA RAG engine and this project’s
              configuration.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask a question about this project’s data…"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 999,
                border: '1px solid #ccc',
                fontSize: '1em',
                outline: 'none'
              }}
            />
            <button
              style={{
                backgroundColor: 'var(--eva-primary)',
                color: '#fff',
                borderRadius: 999,
                border: 'none',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: '0.95em'
              }}
            >
              Send
            </button>
          </div>
        </section>

        {/* Project / RAG config summary (right column) */}
        <aside
          style={{
            backgroundColor: 'var(--eva-surface)',
            borderRadius: 'var(--eva-radius)',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: `calc(var(--eva-font-size-base) * ${theme.headingScale?.h3 ?? 1.1})`
            }}
          >
            Project configuration
          </h2>
          <dl
            style={{
              margin: 0,
              fontSize: '0.9em',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              rowGap: 6,
              columnGap: 8
            }}
          >
            <dt style={{ fontWeight: 600 }}>Owner</dt>
            <dd>{project.ownerName}</dd>

            <dt style={{ fontWeight: 600 }}>Cost center</dt>
            <dd>{project.costCenter}</dd>

            <dt style={{ fontWeight: 600 }}>Status</dt>
            <dd>{project.status}</dd>

            <dt style={{ fontWeight: 600 }}>Security</dt>
            <dd>{project.securityClassification}</dd>

            <dt style={{ fontWeight: 600 }}>Chunking</dt>
            <dd>
              {ragIndex.chunkingStrategy} –{' '}
              {ragIndex.chunkSizeTokens} tokens, overlap{' '}
              {ragIndex.chunkOverlapTokens}
            </dd>

            <dt style={{ fontWeight: 600 }}>Retrieval</dt>
            <dd>
              {ragRetrieval.rankingStrategy} – topK{' '}
              {ragRetrieval.topK}
            </dd>

            <dt style={{ fontWeight: 600 }}>PII redaction</dt>
            <dd>{ragGuardrail.piiRedactionEnabled ? 'Enabled' : 'Disabled'}</dd>

            <dt style={{ fontWeight: 600 }}>Speculative answers</dt>
            <dd>
              {ragGuardrail.allowSpeculativeAnswers ? 'Allowed' : 'Disabled'}
            </dd>

            <dt style={{ fontWeight: 600 }}>Golden questions</dt>
            <dd>{goldenCount}</dd>
          </dl>
        </aside>
      </main>
    </div>
  );
};
