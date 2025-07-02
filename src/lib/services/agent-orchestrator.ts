import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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
      role: "Academic Review",
      systemPrompt: `You are an experienced academic peer reviewer evaluating research papers for publication.
      Focus on:
      - Overall scientific contribution and novelty
      - Literature review completeness
      - Writing clarity and organization
      - Methodology appropriateness
      - Conclusions supported by evidence
      
      Provide balanced feedback suitable for academic publication. Keep responses under 1000 words.`,
    },
    {
      id: "epistemic-analyst",
      name: "Epistemic Analyst",
      role: "Paradigm Analysis",
      systemPrompt: `You are an epistemic analyst specializing in identifying paradigm biases and institutional assumptions.
      Focus on:
      - Hidden assumptions and paradigm lock-in
      - Alternative theoretical frameworks
      - Institutional bias detection
      - Paradigm independence assessment
      - Epistemic archaeology of concepts
      
      Challenge conventional thinking and identify overlooked perspectives. Keep responses under 1000 words.`,
    },
  ]

  private lastRequestTime = 0
  private readonly minRequestInterval = 1000 // 1 second between requests
  private readonly maxRetries = 3

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
            model: openai("gpt-4o-mini"), // Use mini model for better rate limits
            system: agent.systemPrompt,
            prompt: `Please analyze the following research paper:

Title: ${paperTitle}

Content: ${truncatedContent}

Provide a comprehensive analysis from your specialized perspective. Include specific observations, strengths, weaknesses, and recommendations.`,
            maxTokens: 1500, // Limit response length
            temperature: 0.3,
          })

          return text
        })

        // Calculate score based on analysis quality
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
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // If all retries failed, return a fallback result
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

    // Process agents sequentially to avoid rate limits
    for (const agent of this.agents) {
      try {
        const result = await this.analyzeWithAgent(agent.id, paperContent, paperTitle)
        results.push(result)
      } catch (error) {
        console.error(`Failed to analyze with agent ${agent.id}:`, error)
        // Add fallback result instead of skipping
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
    return [...this.agents] // Return copy to prevent mutation
  }

  private calculateScore(analysis: string): number {
    // Improved scoring algorithm
    let score = 0.3 // Base score

    // Length factor (reasonable length gets higher score)
    const wordCount = analysis.split(" ").length
    if (wordCount > 100 && wordCount < 2000) {
      score += 0.2
    }
    if (wordCount > 300 && wordCount < 1500) {
      score += 0.1
    }

    // Quality indicators
    const qualityIndicators = [
      "specific", "detailed", "comprehensive", "rigorous", "methodology",
      "evidence", "analysis", "recommendation", "improvement", "strength",
      "weakness", "observation", "conclusion", "framework", "approach"
    ]

    const foundIndicators = qualityIndicators.filter((indicator) => 
      analysis.toLowerCase().includes(indicator)
    ).length

    score += (foundIndicators / qualityIndicators.length) * 0.3

    // Penalize error messages
    if (analysis.toLowerCase().includes("error") || analysis.toLowerCase().includes("failed")) {
      score = Math.max(0, score - 0.3)
    }

    return Math.min(1.0, Math.max(0.0, score))
  }
}
