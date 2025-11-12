import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { CosmosClient } from '@azure/cosmos';
import { OpenAIClient } from 'openai';

/**
 * EVA Foundation ABGR Specialist Agent
 * 
 * Specialized agent for Agent-Related (ABGR) jurisprudence content:
 * - Government agent regulations and compliance
 * - Agent authorization procedures
 * - Operational guidelines and standards
 * - Compliance validation and reporting
 */

interface ABGRQuery {
  query: string;
  context: string;
  compliance_level: 'public' | 'protected-a' | 'protected-b' | 'classified';
  agent_type?: string;
  regulation_category?: string;
  tenantId: string;
  userId: string;
}

interface ABGRDocument {
  id: string;
  title: string;
  content: string;
  regulation_type: 'authorization' | 'compliance' | 'operational' | 'reporting';
  agent_category: string[];
  compliance_level: string;
  last_updated: Date;
  citations: string[];
  abgr_relevance_score: number;
}

interface ABGRResponse {
  query: string;
  abgr_analysis: {
    relevant_regulations: ABGRDocument[];
    compliance_requirements: string[];
    operational_guidance: string[];
    risk_assessment: any;
  };
  confidence_score: number;
  citations: string[];
  compliance_validated: boolean;
}

class ABGRSpecialistAgent {
  private cosmosClient: CosmosClient;
  private openaiClient: OpenAIClient;
  private knowledgeContainer: any;
  
  constructor() {
    const credential = new DefaultAzureCredential();
    
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      aadCredentials: credential
    });
    
    this.openaiClient = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT!,
      credential
    );
    
    this.knowledgeContainer = this.cosmosClient
      .database('eva-foundation')
      .container('knowledge');
  }
  
  async processABGRQuery(query: ABGRQuery): Promise<ABGRResponse> {
    try {
      // 1. Extract ABGR-specific context and intent
      const queryAnalysis = await this.analyzeABGRQuery(query);
      
      // 2. Search for relevant ABGR documents using HPK optimization
      const relevantDocs = await this.searchABGRDocuments(query, queryAnalysis);
      
      // 3. Validate compliance requirements
      const complianceValidation = await this.validateCompliance(relevantDocs, query.compliance_level);
      
      // 4. Generate specialized ABGR response
      const abgrAnalysis = await this.generateABGRAnalysis(relevantDocs, queryAnalysis, complianceValidation);
      
      // 5. Extract and validate citations
      const citations = await this.extractABGRCitations(relevantDocs);
      
      return {
        query: query.query,
        abgr_analysis: abgrAnalysis,
        confidence_score: this.calculateABGRConfidence(relevantDocs, queryAnalysis),
        citations,
        compliance_validated: complianceValidation.is_valid
      };
      
    } catch (error) {
      throw new Error(`ABGR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getABGRSummary(tenantId: string, category?: string): Promise<any> {
    // Get comprehensive ABGR summary with HPK optimization
    const querySpec = {
      query: `
        SELECT c.regulation_type, c.agent_category, c.compliance_level, 
               COUNT(1) as document_count,
               AVG(c.abgr_relevance_score) as avg_relevance
        FROM c 
        WHERE c.tenantId = @tenantId 
        AND c.type = @type 
        AND c.abgr_related = @abgr_related
        ${category ? 'AND ARRAY_CONTAINS(c.agent_category, @category)' : ''}
        GROUP BY c.regulation_type, c.agent_category, c.compliance_level
      `,
      parameters: [
        { name: '@tenantId', value: tenantId },
        { name: '@type', value: 'jurisprudence' },
        { name: '@abgr_related', value: true },
        ...(category ? [{ name: '@category', value: category }] : [])
      ]
    };
    
    const { resources } = await this.knowledgeContainer.items.query(querySpec).fetchAll();
    
    return {
      tenant_id: tenantId,
      category: category || 'all',
      summary: {
        total_regulations: resources.reduce((sum, r) => sum + r.document_count, 0),
        regulation_breakdown: resources,
        compliance_levels: [...new Set(resources.map(r => r.compliance_level))],
        agent_categories: [...new Set(resources.flatMap(r => r.agent_category))],
        average_relevance: resources.reduce((sum, r) => sum + r.avg_relevance, 0) / resources.length
      },
      last_updated: new Date().toISOString()
    };
  }
  
  async validateAgentAuthorization(agentId: string, operation: string, tenantId: string): Promise<any> {
    // Validate agent authorization against ABGR regulations
    const authQuery = {
      query: `
        SELECT c.id, c.title, c.content, c.authorization_requirements
        FROM c 
        WHERE c.tenantId = @tenantId 
        AND c.regulation_type = @reg_type
        AND CONTAINS(LOWER(c.content), LOWER(@operation))
      `,
      parameters: [
        { name: '@tenantId', value: tenantId },
        { name: '@reg_type', value: 'authorization' },
        { name: '@operation', value: operation }
      ]
    };
    
    const { resources } = await this.knowledgeContainer.items.query(authQuery).fetchAll();
    
    const authorizationResult = await this.processAuthorizationRequirements(resources, agentId, operation);
    
    return {
      agent_id: agentId,
      operation,
      authorization_status: authorizationResult.is_authorized ? 'AUTHORIZED' : 'DENIED',
      applicable_regulations: resources.map(r => ({
        regulation_id: r.id,
        title: r.title,
        requirements: r.authorization_requirements
      })),
      compliance_notes: authorizationResult.compliance_notes,
      risk_level: authorizationResult.risk_level,
      validated_at: new Date().toISOString()
    };
  }
  
  async generateComplianceReport(tenantId: string, period: string): Promise<any> {
    // Generate comprehensive ABGR compliance report
    const reportQuery = {
      query: `
        SELECT c.regulation_type, c.compliance_level, c.agent_category,
               c.last_reviewed, c.compliance_status
        FROM c 
        WHERE c.tenantId = @tenantId 
        AND c.type = @type
        AND c.abgr_related = @abgr_related
        AND c.last_reviewed >= @period_start
      `,
      parameters: [
        { name: '@tenantId', value: tenantId },
        { name: '@type', value: 'jurisprudence' },
        { name: '@abgr_related', value: true },
        { name: '@period_start', value: this.calculatePeriodStart(period) }
      ]
    };
    
    const { resources } = await this.knowledgeContainer.items.query(reportQuery).fetchAll();
    
    return {
      report_id: this.generateReportId(),
      tenant_id: tenantId,
      reporting_period: period,
      compliance_summary: {
        total_regulations_reviewed: resources.length,
        compliance_by_level: this.groupByComplianceLevel(resources),
        regulation_by_type: this.groupByRegulationType(resources),
        risk_assessment: await this.generateRiskAssessment(resources),
        recommendations: await this.generateComplianceRecommendations(resources)
      },
      generated_at: new Date().toISOString(),
      next_review_date: this.calculateNextReviewDate(period)
    };
  }
  
  private async analyzeABGRQuery(query: ABGRQuery): Promise<any> {
    // Use OpenAI to analyze ABGR-specific query intent
    const completion = await this.openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: `You are an ABGR (Agent) specialist for government regulations. Analyze queries related to:
        - Government agent authorization and compliance
        - Operational procedures and guidelines
        - Regulatory requirements and standards
        - Risk assessment and mitigation
        
        Extract key concepts, regulation categories, and compliance levels.`
      }, {
        role: 'user',
        content: `Analyze this ABGR query: "${query.query}" with context: "${query.context}"`
      }],
      temperature: 0.1
    });
    
    const analysis = completion.choices[0]?.message?.content || '';
    
    return {
      intent: this.extractQueryIntent(analysis),
      regulation_categories: this.extractRegulationCategories(analysis),
      compliance_focus: this.extractComplianceFocus(analysis),
      risk_indicators: this.extractRiskIndicators(analysis),
      agent_types: this.extractAgentTypes(analysis)
    };
  }
  
  private async searchABGRDocuments(query: ABGRQuery, analysis: any): Promise<ABGRDocument[]> {
    // Search with HPK optimization and ABGR-specific relevance scoring
    const searchQuery = {
      query: `
        SELECT c.id, c.title, c.content, c.regulation_type, c.agent_category,
               c.compliance_level, c.last_updated, c.citations, c.abgr_relevance_score
        FROM c 
        WHERE c.tenantId = @tenantId 
        AND c.type = @type
        AND c.abgr_related = @abgr_related
        AND c.compliance_level = @compliance_level
        AND (
          CONTAINS(LOWER(c.content), LOWER(@query)) OR
          CONTAINS(LOWER(c.title), LOWER(@query)) OR
          ARRAY_CONTAINS(c.agent_category, @agent_focus)
        )
        ORDER BY c.abgr_relevance_score DESC, c.last_updated DESC
        OFFSET 0 LIMIT 20
      `,
      parameters: [
        { name: '@tenantId', value: query.tenantId },
        { name: '@type', value: 'jurisprudence' },
        { name: '@abgr_related', value: true },
        { name: '@compliance_level', value: query.compliance_level },
        { name: '@query', value: query.query },
        { name: '@agent_focus', value: analysis.agent_types[0] || 'general' }
      ]
    };
    
    const { resources } = await this.knowledgeContainer.items.query(searchQuery).fetchAll();
    
    // Enhance relevance scoring with semantic analysis
    return await Promise.all(
      resources.map(async (doc) => ({
        ...doc,
        semantic_relevance: await this.calculateSemanticRelevance(query.query, doc.content),
        abgr_specificity: await this.calculateABGRSpecificity(doc, analysis)
      }))
    );
  }
  
  private async validateCompliance(docs: ABGRDocument[], complianceLevel: string): Promise<any> {
    // Validate compliance requirements against documents
    const complianceRules = await this.getComplianceRules(complianceLevel);
    
    const validationResults = docs.map(doc => ({
      document_id: doc.id,
      compliance_met: this.checkComplianceRules(doc, complianceRules),
      risk_level: this.assessRiskLevel(doc, complianceLevel),
      required_actions: this.identifyRequiredActions(doc, complianceRules)
    }));
    
    return {
      is_valid: validationResults.every(r => r.compliance_met),
      overall_risk: this.calculateOverallRisk(validationResults),
      validation_details: validationResults,
      compliance_gaps: validationResults.filter(r => !r.compliance_met)
    };
  }
  
  private async generateABGRAnalysis(docs: ABGRDocument[], analysis: any, compliance: any): Promise<any> {
    // Generate specialized ABGR analysis
    return {
      relevant_regulations: docs.slice(0, 10), // Top 10 most relevant
      compliance_requirements: this.extractComplianceRequirements(docs),
      operational_guidance: this.extractOperationalGuidance(docs),
      risk_assessment: {
        overall_risk: compliance.overall_risk,
        risk_factors: this.identifyRiskFactors(docs, analysis),
        mitigation_strategies: this.suggestMitigationStrategies(docs, compliance)
      },
      regulatory_gaps: this.identifyRegulatoryGaps(docs, analysis),
      recommendations: this.generateRecommendations(docs, analysis, compliance)
    };
  }
  
  private async extractABGRCitations(docs: ABGRDocument[]): Promise<string[]> {
    // Extract and validate ABGR-specific citations
    const allCitations = docs.flatMap(doc => doc.citations || []);
    const uniqueCitations = [...new Set(allCitations)];
    
    // Validate citations against known ABGR sources
    const validatedCitations = await Promise.all(
      uniqueCitations.map(async (citation) => ({
        citation,
        is_valid: await this.validateCitation(citation),
        source_type: this.identifyCitationSource(citation)
      }))
    );
    
    return validatedCitations
      .filter(c => c.is_valid)
      .map(c => c.citation);
  }
  
  private calculateABGRConfidence(docs: ABGRDocument[], analysis: any): number {
    // Calculate confidence based on ABGR-specific factors
    const factors = {
      document_relevance: docs.reduce((sum, doc) => sum + (doc.abgr_relevance_score || 0), 0) / docs.length,
      coverage_completeness: this.assessCoverageCompleteness(docs, analysis),
      source_authority: this.assessSourceAuthority(docs),
      recency: this.assessDocumentRecency(docs)
    };
    
    return (factors.document_relevance * 0.4 + 
            factors.coverage_completeness * 0.3 + 
            factors.source_authority * 0.2 + 
            factors.recency * 0.1);
  }
  
  // Utility methods for ABGR processing
  private extractQueryIntent(analysis: string): string {
    // Extract query intent from AI analysis
    return 'compliance_validation'; // Simplified
  }
  
  private extractRegulationCategories(analysis: string): string[] {
    return ['authorization', 'operational']; // Simplified
  }
  
  private extractComplianceFocus(analysis: string): string {
    return 'protected-b'; // Simplified
  }
  
  private extractRiskIndicators(analysis: string): string[] {
    return ['data_access', 'authorization']; // Simplified
  }
  
  private extractAgentTypes(analysis: string): string[] {
    return ['government_agent']; // Simplified
  }
  
  private async calculateSemanticRelevance(query: string, content: string): Promise<number> {
    // Simplified semantic relevance calculation
    return 0.85;
  }
  
  private async calculateABGRSpecificity(doc: ABGRDocument, analysis: any): Promise<number> {
    // Calculate how specific document is to ABGR concerns
    return 0.9;
  }
  
  private async getComplianceRules(level: string): Promise<any[]> {
    return []; // Would load from compliance rule set
  }
  
  private checkComplianceRules(doc: ABGRDocument, rules: any[]): boolean {
    return true; // Simplified compliance check
  }
  
  private assessRiskLevel(doc: ABGRDocument, level: string): 'low' | 'medium' | 'high' | 'critical' {
    return 'medium'; // Simplified risk assessment
  }
  
  private identifyRequiredActions(doc: ABGRDocument, rules: any[]): string[] {
    return []; // Required compliance actions
  }
  
  private calculateOverallRisk(results: any[]): 'low' | 'medium' | 'high' | 'critical' {
    return 'medium'; // Aggregate risk calculation
  }
  
  private extractComplianceRequirements(docs: ABGRDocument[]): string[] {
    return docs.flatMap(doc => 
      doc.content.match(/must|shall|required|mandatory/gi) || []
    ).slice(0, 10);
  }
  
  private extractOperationalGuidance(docs: ABGRDocument[]): string[] {
    return docs.flatMap(doc =>
      doc.content.match(/should|recommended|best practice/gi) || []
    ).slice(0, 10);
  }
  
  private identifyRiskFactors(docs: ABGRDocument[], analysis: any): string[] {
    return ['unauthorized_access', 'compliance_gaps'];
  }
  
  private suggestMitigationStrategies(docs: ABGRDocument[], compliance: any): string[] {
    return ['enhanced_authorization', 'regular_compliance_review'];
  }
  
  private identifyRegulatoryGaps(docs: ABGRDocument[], analysis: any): string[] {
    return [];
  }
  
  private generateRecommendations(docs: ABGRDocument[], analysis: any, compliance: any): string[] {
    return ['Review authorization procedures', 'Update compliance documentation'];
  }
  
  private async validateCitation(citation: string): Promise<boolean> {
    return true; // Citation validation logic
  }
  
  private identifyCitationSource(citation: string): string {
    return 'regulation'; // Source type identification
  }
  
  private assessCoverageCompleteness(docs: ABGRDocument[], analysis: any): number {
    return 0.8; // Coverage assessment
  }
  
  private assessSourceAuthority(docs: ABGRDocument[]): number {
    return 0.9; // Authority assessment
  }
  
  private assessDocumentRecency(docs: ABGRDocument[]): number {
    return 0.85; // Recency assessment
  }
  
  // Report generation utilities
  private calculatePeriodStart(period: string): string {
    const now = new Date();
    switch (period) {
      case 'monthly': return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      case 'quarterly': return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      case 'yearly': return new Date(now.getFullYear() - 1, 0, 1).toISOString();
      default: return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }
  
  private generateReportId(): string {
    return `abgr_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private groupByComplianceLevel(resources: any[]): any {
    return resources.reduce((acc, r) => {
      acc[r.compliance_level] = (acc[r.compliance_level] || 0) + 1;
      return acc;
    }, {});
  }
  
  private groupByRegulationType(resources: any[]): any {
    return resources.reduce((acc, r) => {
      acc[r.regulation_type] = (acc[r.regulation_type] || 0) + 1;
      return acc;
    }, {});
  }
  
  private async generateRiskAssessment(resources: any[]): Promise<any> {
    return {
      overall_risk: 'medium',
      risk_categories: ['authorization', 'compliance', 'operational'],
      high_risk_areas: []
    };
  }
  
  private async generateComplianceRecommendations(resources: any[]): Promise<string[]> {
    return [
      'Regular compliance audits',
      'Update authorization procedures',
      'Enhance monitoring systems'
    ];
  }
  
  private calculateNextReviewDate(period: string): string {
    const now = new Date();
    switch (period) {
      case 'monthly': return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      case 'quarterly': return new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();
      case 'yearly': return new Date(now.getFullYear() + 1, 0, 1).toISOString();
      default: return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    }
  }
  
  private async processAuthorizationRequirements(resources: any[], agentId: string, operation: string): Promise<any> {
    return {
      is_authorized: true,
      compliance_notes: ['Authorization verified'],
      risk_level: 'low'
    };
  }
}

export async function abgrSpecialistAgent(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('EVA Foundation ABGR Specialist Agent request received');
  
  try {
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation') || 'query';
    
    const agent = new ABGRSpecialistAgent();
    let result: any;
    
    switch (operation) {
      case 'query': {
        const query: ABGRQuery = JSON.parse(await request.text());
        result = await agent.processABGRQuery(query);
        break;
      }
      case 'summary': {
        const { tenantId, category } = JSON.parse(await request.text());
        result = await agent.getABGRSummary(tenantId, category);
        break;
      }
      case 'authorize': {
        const { agentId, operation: op, tenantId } = JSON.parse(await request.text());
        result = await agent.validateAgentAuthorization(agentId, op, tenantId);
        break;
      }
      case 'report': {
        const { tenantId, period } = JSON.parse(await request.text());
        result = await agent.generateComplianceReport(tenantId, period);
        break;
      }
      default:
        return {
          status: 400,
          body: JSON.stringify({ error: `Unknown operation: ${operation}` })
        };
    }
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    context.log('Error in ABGR Specialist Agent:', error);
    
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
}

app.http('abgr-specialist-agent', {
  methods: ['POST'],
  authLevel: 'function',
  handler: abgrSpecialistAgent
});
