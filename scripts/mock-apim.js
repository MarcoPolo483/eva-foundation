#!/usr/bin/env node
/**
 * EVA Foundation 2.0 - Mock APIM Server
 * Development server implementing APIM contract for local testing
 * 
 * Usage: node scripts/mock-apim.js
 * Port: 5178 (default) or MOCK_APIM_PORT environment variable
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = process.env.MOCK_APIM_PORT || 5178;
const functionsBaseUrl = process.env.FUNCTIONS_BASE_URL || 'http://localhost:7071';

// Utility function for random IDs
function randId() {
  return Math.random().toString(36).substring(2, 9);
}

// Middleware to validate APIM headers
function validateAPIMHeaders(req, res, next) {
  const required = ['x-project', 'x-app', 'x-user'];
  const missing = required.filter(header => !req.headers[header]);
  
  if (missing.length) {
    console.warn(`⚠️  Missing APIM headers for ${req.method} ${req.path}:`, missing);
    return res.status(400).json({ 
      error: `Missing required headers: ${missing.join(', ')}`,
      required,
      provided: Object.keys(req.headers).filter(h => h.startsWith('x-'))
    });
  }
  
  // Add tracing header
  req.headers['x-request-id'] = req.headers['x-request-id'] || `apim_${randId()}`;
  
  console.log(`✅ APIM headers validated for ${req.method} ${req.path}`);
  next();
}

// Middleware to add APIM policy headers
function addAPIMPolicyHeaders(req, res, next) {
  // Add governance headers
  req.headers['x-apim-source'] = 'mock-apim';
  req.headers['x-apim-policy'] = 'development';
  req.headers['x-apim-timestamp'] = new Date().toISOString();
  
  // Add rate limiting simulation (mock)
  res.setHeader('X-Rate-Limit-Remaining', '999');
  res.setHeader('X-Rate-Limit-Reset', Math.floor(Date.now() / 1000) + 3600);
  
  next();
}

// RAG Answer endpoint - implements APIM contract
app.post('/rag/answer', validateAPIMHeaders, addAPIMPolicyHeaders, async (req, res) => {
  const { projectId, message, template } = req.body || {};
  const responseId = randId();
  
  console.log(`🧠 RAG Answer Request:`, {
    projectId,
    messageLength: message?.length,
    template,
    headers: {
      project: req.headers['x-project'],
      app: req.headers['x-app'],
      user: req.headers['x-user']
    }
  });

  // Simulate processing delay
  const processingTime = Math.floor(Math.random() * 500) + 200;
  
  setTimeout(() => {
    const answer = `Mock RAG Response ${responseId}: Based on project "${projectId}", here's an answer to your question about "${message?.substring(0, 50)}...". ${template ? `[Using template with temperature=${template.temperature}, top_k=${template.top_k}]` : ''}`;
    
    const metadata = {
      confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
      sources: [
        `mock-doc-${responseId}-1.pdf`,
        `mock-doc-${responseId}-2.docx`
      ],
      processingTime,
      model: 'gpt-4-mock',
      tokensUsed: Math.floor(Math.random() * 500) + 100
    };

    console.log(`✅ RAG Response sent (${processingTime}ms):`, { 
      answerLength: answer.length,
      confidence: metadata.confidence,
      sources: metadata.sources.length
    });

    res.json({ answer, metadata });
  }, Math.floor(Math.random() * 100) + 50);
});

// Document Summarization endpoint
app.post('/doc/summarize', validateAPIMHeaders, addAPIMPolicyHeaders, (req, res) => {
  const { documents, options } = req.body || {};
  const responseId = randId();
  
  console.log(`📄 Document Summarize Request:`, {
    documentCount: documents?.length,
    options,
    project: req.headers['x-project']
  });

  setTimeout(() => {
    const summary = `Mock Summary ${responseId}: This is a simulated document summary for ${documents?.length || 0} documents in project "${req.headers['x-project']}".`;
    
    const metadata = {
      documentCount: documents?.length || 0,
      processingTime: Math.floor(Math.random() * 1000) + 500,
      wordsProcessed: Math.floor(Math.random() * 5000) + 1000,
      compressionRatio: 0.15
    };

    res.json({ summary, metadata });
  }, Math.floor(Math.random() * 200) + 100);
});

// Document Comparison endpoint
app.post('/doc/compare', validateAPIMHeaders, addAPIMPolicyHeaders, (req, res) => {
  const { documents, comparisonType } = req.body || {};
  const responseId = randId();
  
  console.log(`🔍 Document Compare Request:`, {
    documentCount: documents?.length,
    comparisonType,
    project: req.headers['x-project']
  });

  setTimeout(() => {
    const comparison = `Mock Comparison ${responseId}: Comparing ${documents?.length || 0} documents using ${comparisonType || 'default'} method.`;
    
    const differences = [
      { type: 'content', section: 'Introduction', severity: 'minor' },
      { type: 'structure', section: 'Methodology', severity: 'major' }
    ];

    const metadata = {
      comparisonType: comparisonType || 'semantic',
      documentsCompared: documents?.length || 0,
      differencesFound: differences.length,
      similarityScore: Math.round(Math.random() * 30 + 70) / 100
    };

    res.json({ comparison, differences, metadata });
  }, Math.floor(Math.random() * 300) + 150);
});

// Document Extraction endpoint
app.post('/doc/extract', validateAPIMHeaders, addAPIMPolicyHeaders, (req, res) => {
  const { documents, extractionRules } = req.body || {};
  const responseId = randId();
  
  console.log(`📊 Document Extract Request:`, {
    documentCount: documents?.length,
    extractionRules: Object.keys(extractionRules || {}),
    project: req.headers['x-project']
  });

  setTimeout(() => {
    const extracted = {
      entities: [`entity-${responseId}-1`, `entity-${responseId}-2`],
      keyPhrases: [`phrase-${responseId}-1`, `phrase-${responseId}-2`],
      summary: `Extracted data from ${documents?.length || 0} documents`,
      tables: [`table-${responseId}-1`]
    };

    const metadata = {
      documentsProcessed: documents?.length || 0,
      entitiesFound: extracted.entities.length,
      tablesExtracted: extracted.tables.length,
      processingTime: Math.floor(Math.random() * 800) + 400
    };

    res.json({ extracted, metadata });
  }, Math.floor(Math.random() * 400) + 200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-mock',
    environment: 'development',
    message: 'Mock APIM server is running'
  });
});

// Agent endpoints
app.get('/agents', (req, res) => {
  const agents = [
    { id: 'agent-1', name: 'Data Architecture', status: 'online' },
    { id: 'agent-2', name: 'Design System', status: 'online' },
    { id: 'agent-3', name: 'Monitoring', status: 'online' },
    { id: 'agent-4', name: 'Security', status: 'online' },
    { id: 'agent-5', name: 'API Integration', status: 'online' },
    { id: 'agent-6', name: 'Configuration', status: 'online' }
  ];

  res.json({ agents, totalCount: agents.length });
});

// Proxy to actual Azure Functions for testing integration
if (process.env.PROXY_TO_FUNCTIONS === 'true') {
  console.log(`🔄 Proxying unhandled requests to Azure Functions at ${functionsBaseUrl}`);
  
  app.use('/api', createProxyMiddleware({
    target: functionsBaseUrl,
    changeOrigin: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying ${req.method} ${req.url} to Azure Functions`);
    }
  }));
}

// Default handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`❓ Unhandled request: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    error: 'Endpoint not found in Mock APIM',
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: [
      'POST /rag/answer',
      'POST /doc/summarize', 
      'POST /doc/compare',
      'POST /doc/extract',
      'GET /health',
      'GET /agents'
    ],
    note: 'Set PROXY_TO_FUNCTIONS=true to proxy unhandled requests to Azure Functions'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Mock APIM Error:', error);
  
  res.status(500).json({
    error: 'Mock APIM Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 EVA Foundation Mock APIM Server running on http://localhost:${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST http://localhost:${port}/rag/answer`);
  console.log(`   POST http://localhost:${port}/doc/summarize`);
  console.log(`   POST http://localhost:${port}/doc/compare`);
  console.log(`   POST http://localhost:${port}/doc/extract`);
  console.log(`   GET  http://localhost:${port}/health`);
  console.log(`   GET  http://localhost:${port}/agents`);
  console.log(``);
  console.log(`💡 Usage example:`);
  console.log(`   curl -X POST http://localhost:${port}/rag/answer \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -H "x-project: demo-project" \\`);
  console.log(`     -H "x-app: eva-da-ui" \\`);
  console.log(`     -H "x-user: test-user" \\`);
  console.log(`     -d '{"projectId":"demo","message":"What is the capital of France?"}'`);
  console.log(``);
  console.log(`🔗 Functions Integration: Set PROXY_TO_FUNCTIONS=true to proxy to Azure Functions`);
  console.log(`📁 Logs are written to scripts/mock-apim.log`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n🛑 Mock APIM Server shutting down...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Mock APIM Server terminated`);
  process.exit(0);
});
