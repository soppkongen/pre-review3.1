import { getWeaviateClient } from "../weaviate"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface PhysicsChunk {
  chunkId?: string
  content: string
  sourceDocument?: string
  domain?: string
  subdomain?: string
  concepts?: string[]
  difficultyLevel?: string
}

export class KnowledgeBaseService {
  private client = getWeaviateClient()

  async searchKnowledge(query: string, limit = 10): Promise<PhysicsChunk[]> {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName("PhysicsChunk")
        .withFields("chunkId content sourceDocument domain subdomain concepts difficultyLevel")
        .withNearText({ concepts: [query] })
        .withLimit(limit)
        .do()

      return result.data?.Get?.PhysicsChunk || []
    } catch (error) {
      console.error("Error searching knowledge base:", error)
      throw new Error("Failed to search knowledge base")
    }
  }

  async explainConcept(concept: string): Promise<string> {
    try {
      // First, search for the concept in our knowledge base
      const knowledge = await this.searchKnowledge(concept, 3)

      let context = ""
      if (knowledge.length > 0) {
        context = knowledge
          .map(
            (k) =>
              `Content: ${k.content}\nDomain: ${k.domain}\nSubdomain: ${k.subdomain}\nSource: ${k.sourceDocument}`,
          )
          .join("\n\n")
      }

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `You are a physics expert. Explain physics concepts clearly and accurately. 
                 Use the provided knowledge base context when available, but also draw from your general physics knowledge.
                 Provide explanations appropriate for the concept's difficulty level.
                 Include relevant equations, examples, and applications when helpful.`,
        prompt: `Explain the physics concept: "${concept}"
                 
                 ${context ? `Knowledge base context:\n${context}` : ""}
                 
                 Please provide a comprehensive explanation that includes:
                 1. Clear definition
                 2. Key principles
                 3. Mathematical formulation (if applicable)
                 4. Real-world applications
                 5. Common misconceptions (if any)`,
      })

      return text
    } catch (error) {
      console.error("Error explaining concept:", error)
      throw new Error("Failed to generate explanation")
    }
  }

  async getKnowledgeStats(): Promise<{
    totalConcepts: number
    domainDistribution: Record<string, number>
    difficultyDistribution: Record<string, number>
  }> {
    try {
      // Get total count
      const totalResult = await this.client.graphql
        .aggregate()
        .withClassName("PhysicsChunk")
        .withFields("meta { count }")
        .do()

      const totalConcepts = totalResult.data?.Aggregate?.PhysicsChunk?.[0]?.meta?.count || 0

      // Get all concepts to calculate distributions
      const allConcepts = await this.client.graphql
        .get()
        .withClassName("PhysicsChunk")
        .withFields("domain difficultyLevel")
        .withLimit(1000)
        .do()

      const concepts = allConcepts.data?.Get?.PhysicsChunk || []

      const domainDistribution: Record<string, number> = {}
      const difficultyDistribution: Record<string, number> = {}

      concepts.forEach((concept: { domain?: string; difficultyLevel?: string }) => {
        if (concept.domain) {
          domainDistribution[concept.domain] = (domainDistribution[concept.domain] || 0) + 1
        }
        if (concept.difficultyLevel) {
          difficultyDistribution[concept.difficultyLevel] = (difficultyDistribution[concept.difficultyLevel] || 0) + 1
        }
      })

      return {
        totalConcepts,
        domainDistribution,
        difficultyDistribution,
      }
    } catch (error) {
      console.error("Error getting knowledge stats:", error)
      return {
        totalConcepts: 0,
        domainDistribution: {},
        difficultyDistribution: {},
      }
    }
  }
}

