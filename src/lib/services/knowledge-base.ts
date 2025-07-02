import { getWeaviateClient, type PhysicsKnowledge } from "../weaviate"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export class KnowledgeBaseService {
  private client = getWeaviateClient()

  async searchKnowledge(query: string, limit = 10): Promise<PhysicsKnowledge[]> {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName("PhysicsKnowledge")
        .withFields("concept description field difficulty equations applications relatedConcepts examples")
        .withNearText({ concepts: [query] })
        .withLimit(limit)
        .do()

      return result.data?.Get?.PhysicsKnowledge || []
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
              `Concept: ${k.concept}\nDescription: ${k.description}\nField: ${k.field}\nDifficulty: ${k.difficulty}`,
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

  async addKnowledge(knowledge: PhysicsKnowledge): Promise<string> {
    try {
      const result = await this.client.data.creator().withClassName("PhysicsKnowledge").withProperties(knowledge).do()

      return result.id
    } catch (error) {
      console.error("Error adding knowledge:", error)
      throw new Error("Failed to add knowledge")
    }
  }

  async getKnowledgeStats(): Promise<{
    totalConcepts: number
    fieldDistribution: Record<string, number>
    difficultyDistribution: Record<string, number>
  }> {
    try {
      // Get total count
      const totalResult = await this.client.graphql
        .aggregate()
        .withClassName("PhysicsKnowledge")
        .withFields("meta { count }")
        .do()

      const totalConcepts = totalResult.data?.Aggregate?.PhysicsKnowledge?.[0]?.meta?.count || 0

      // Get all concepts to calculate distributions
      const allConcepts = await this.client.graphql
        .get()
        .withClassName("PhysicsKnowledge")
        .withFields("field difficulty")
        .withLimit(1000)
        .do()

      const concepts = allConcepts.data?.Get?.PhysicsKnowledge || []

      const fieldDistribution: Record<string, number> = {}
      const difficultyDistribution: Record<string, number> = {}

      concepts.forEach((concept: any) => {
        if (concept.field) {
          fieldDistribution[concept.field] = (fieldDistribution[concept.field] || 0) + 1
        }
        if (concept.difficulty) {
          difficultyDistribution[concept.difficulty] = (difficultyDistribution[concept.difficulty] || 0) + 1
        }
      })

      return {
        totalConcepts,
        fieldDistribution,
        difficultyDistribution,
      }
    } catch (error) {
      console.error("Error getting knowledge stats:", error)
      return {
        totalConcepts: 0,
        fieldDistribution: {},
        difficultyDistribution: {},
      }
    }
  }
}
