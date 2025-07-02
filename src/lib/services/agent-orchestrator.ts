import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface Agent {
  id: string
  name: string
  role: string
  systemPrompt: string
}

export interface AnalysisResult {
  agentId: string
  agentName: string
  analysis: string
  score: number
  timestamp: Date
}

export interface AnalysisRequest {
  paperId: string
  paper: {
    title: string
    content: string
    authors?: string[]
    abstract?: string
  }
  analysisTypes?: string[]
}

export class AgentOrchestrator {
  private agents: Agent[] = [
    {
      id: "theoretical-physicist",
      name: "Theoretical Physicist", 
      role: "Theory Analysis",
      systemPrompt: `You are a theoretical physicist specializing in evaluating the theoretical foundations of research papers. 
      Focus on:
      - Mathematical rigor and consistency
      - Theoretical framework validity
      - Novel theoretical contributions
      - Connection to established physics principles
      - Potential theoretical implications
      
      Provide constructive analysis with specific examples and suggestions. Keep responses under 1000 words.`,
    },
    {
      id: "experimental-physicist",
      name: "Experimental Physicist",
      role: "Experimental Design", 
      systemPrompt: `You are an experimental physicist evaluating the experimental aspects of research papers.
      Focus on:
      - Experimental design and methodology
      - Data analysis and statistical validity
      - Measurement techniques and instrumentation
      - Error analysis and uncertainty quantification
      - Reproducibility and experimental controls
      
      Provide practical feedback on experimental approaches. Keep responses under 1000 words.`,
    },
    {
      id: "peer-reviewer",
      name: "Peer Reviewer",
      role: "Overall Assessment",
      systemPrompt: `You are an experienced peer reviewer for physics journals.
      Focus on:
      - Overall paper quality and contribution
      - Clarity of presentation and writing
      - Literature review completeness
      - Significance of findings
      - Publication readiness
      
      Provide balanced feedback suitable for journal review. Keep responses under 1000 words.`,
    },
    {
      id: "bias-detector",
      name: "Bias Detection Agent",
      role: "Bias Analysis",
      systemPrompt: `You are a bias detection specialist focused on identifying potential biases in research papers.
      Focus on:
      - Selection bias in data or methodology
      - Confirmation bias in interpretation
      - Publication bias considerations
      - Statistical bias and cherry-picking
      - Conflicts of interest
      
      Provide objective analysis of potential biases. Keep responses under 1000 words.`,
    }
  ]

  private lastRequestTime = 0
  private readonly minRequestInterval = 1000 // 1 second between requests
  private readonly maxRetries = 3

  async startAnalysis(request: AnalysisRequest): Promise<string> {
    // Generate unique analysis ID
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store analysis request for streaming
    // In a real app, this would be stored in a database
    console.log(`Starting analysis ${analysisId} for paper: ${request.paper.title}`)
    
    return analysisId
  }

  private async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
    return fn()
  }

  async analyzeWithAgent(agentId: string, paperContent: string, paperTitle: string): Promise<AnalysisResult> {
    const agent = this.agents.find((a) => a.id === agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.rateLimitedRequest(async () => {
          // Truncate content if too long to prevent API limits
          const truncatedContent = paperContent.length > 8000 
            ? paperContent.substring(0, 8000) + "... [content truncated]"
            : paperContent

          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            system: agent.systemPrompt,
            prompt: `Please analyze the following research paper:

Title: ${paperTitle}

Content: ${truncatedContent}

Provide a comprehensive analysis from your specialized perspective. Include specific observations, strengths, weaknesses, and recommendations.`,
            maxTokens: 1500,
            temperature: 0.3,
          })

          return text
        })

        const score = this.calculateScore(result)

        return {
          agentId: agent.id,
          agentName: agent.name,
          analysis: result,
          score,
          timestamp: new Date(),
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`Analysis attempt ${attempt} failed for agent ${agentId}:`, lastError.message)
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      analysis: `Analysis failed after ${this.maxRetries} attempts. Error: ${lastError?.message || 'Unknown error'}`,
      score: 0,
      timestamp: new Date(),
    }
  }

  async analyzeWithAllAgents(paperContent: string, paperTitle: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = []

    for (const agent of this.agents) {
      try {
        const result = await this.analyzeWithAgent(agent.id, paperContent, paperTitle)
        results.push(result)
      } catch (error) {
        console.error(`Failed to analyze with agent ${agent.id}:`, error)
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          analysis: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          score: 0,
          timestamp: new Date(),
        })
      }
    }

    return results
  }

  getAgents(): Agent[] {
    return [...this.agents]
  }

  private calculateScore(analysis: string): number {
    let score = 0.3

    const wordCount = analysis.split(" ").length
    if (wordCount > 100 && wordCount < 2000) {
      score += 0.2
    }
    if (wordCount > 300 && wordCount < 1500) {
      score += 0.1
    }

    // Quality indicators
    const qualityKeywords = [
      "analysis", "evidence", "methodology", "conclusion", "recommendation",
      "strength", "weakness", "improvement", "significant", "novel"
    ]
    
    const foundKeywords = qualityKeywords.filter(keyword => 
      analysis.toLowerCase().includes(keyword)
    ).length
    
    score += Math.min(foundKeywords * 0.05, 0.3)

    return Math.min(Math.max(score, 0), 1)
  }
}

