import weaviate, { type WeaviateClient, ApiKey } from "weaviate-ts-client"

let client: WeaviateClient | null = null

export function getWeaviateClient(): WeaviateClient {
  if (!client) {
    if (!process.env.WEAVIATE_API_KEY || !process.env.REST_ENDPOINT_URL) {
      throw new Error(
        "Weaviate configuration missing. Please set WEAVIATE_API_KEY and REST_ENDPOINT_URL environment variables.",
      )
    }

    client = weaviate.client({
      scheme: "https",
      host: process.env.REST_ENDPOINT_URL.replace("https://", ""),
      apiKey: new ApiKey(process.env.WEAVIATE_API_KEY),
      headers: { "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY || "" },
    })
  }
  return client
}

export interface PhysicsKnowledge {
  id?: string
  concept: string
  description: string
  field: string
  difficulty: string
  equations?: string[]
  applications?: string[]
  relatedConcepts?: string[]
  examples?: string[]
}

export interface ResearchPaper {
  id?: string
  title: string
  authors: string[]
  abstract: string
  content: string
  field: string
  keywords: string[]
  uploadDate: string
  fileType: string
}

export interface AnalysisResult {
  id?: string
  paperId: string
  analysisType: string
  result: string
  confidence: number
  timestamp: string
  agentId: string
}

export async function initializeWeaviateSchema() {
  const client = getWeaviateClient()

  try {
    // Check if classes already exist
    const schema = await client.schema.getter().do()
    const existingClasses = schema.classes?.map((c) => c.class) || []

    // Create PhysicsKnowledge class if it doesn't exist
    if (!existingClasses.includes("PhysicsKnowledge")) {
      await client.schema
        .classCreator()
        .withClass({
          class: "PhysicsKnowledge",
          description: "Physics concepts and knowledge base",
          vectorizer: "text2vec-openai",
          moduleConfig: {
            "text2vec-openai": {
              model: "ada",
              modelVersion: "002",
              type: "text",
            },
          },
          properties: [
            {
              name: "concept",
              dataType: ["text"],
              description: "The physics concept name",
            },
            {
              name: "description",
              dataType: ["text"],
              description: "Detailed description of the concept",
            },
            {
              name: "field",
              dataType: ["text"],
              description: "Physics field (e.g., quantum mechanics, thermodynamics)",
            },
            {
              name: "difficulty",
              dataType: ["text"],
              description: "Difficulty level (beginner, intermediate, advanced)",
            },
            {
              name: "equations",
              dataType: ["text[]"],
              description: "Related equations",
            },
            {
              name: "applications",
              dataType: ["text[]"],
              description: "Real-world applications",
            },
            {
              name: "relatedConcepts",
              dataType: ["text[]"],
              description: "Related physics concepts",
            },
            {
              name: "examples",
              dataType: ["text[]"],
              description: "Examples and use cases",
            },
          ],
        })
        .do()
    }

    // Create ResearchPaper class if it doesn't exist
    if (!existingClasses.includes("ResearchPaper")) {
      await client.schema
        .classCreator()
        .withClass({
          class: "ResearchPaper",
          description: "Research papers for analysis",
          vectorizer: "text2vec-openai",
          moduleConfig: {
            "text2vec-openai": {
              model: "ada",
              modelVersion: "002",
              type: "text",
            },
          },
          properties: [
            {
              name: "title",
              dataType: ["text"],
              description: "Paper title",
            },
            {
              name: "authors",
              dataType: ["text[]"],
              description: "Paper authors",
            },
            {
              name: "abstract",
              dataType: ["text"],
              description: "Paper abstract",
            },
            {
              name: "content",
              dataType: ["text"],
              description: "Full paper content",
            },
            {
              name: "field",
              dataType: ["text"],
              description: "Research field",
            },
            {
              name: "keywords",
              dataType: ["text[]"],
              description: "Paper keywords",
            },
            {
              name: "uploadDate",
              dataType: ["text"],
              description: "Upload timestamp",
            },
            {
              name: "fileType",
              dataType: ["text"],
              description: "File type (pdf, txt, etc.)",
            },
          ],
        })
        .do()
    }

    // Create AnalysisResult class if it doesn't exist
    if (!existingClasses.includes("AnalysisResult")) {
      await client.schema
        .classCreator()
        .withClass({
          class: "AnalysisResult",
          description: "Multi-agent analysis results",
          vectorizer: "text2vec-openai",
          moduleConfig: {
            "text2vec-openai": {
              model: "ada",
              modelVersion: "002",
              type: "text",
            },
          },
          properties: [
            {
              name: "paperId",
              dataType: ["text"],
              description: "Reference to analyzed paper",
            },
            {
              name: "analysisType",
              dataType: ["text"],
              description: "Type of analysis performed",
            },
            {
              name: "result",
              dataType: ["text"],
              description: "Analysis result content",
            },
            {
              name: "confidence",
              dataType: ["number"],
              description: "Confidence score (0-1)",
            },
            {
              name: "timestamp",
              dataType: ["text"],
              description: "Analysis timestamp",
            },
            {
              name: "agentId",
              dataType: ["text"],
              description: "ID of the agent that performed analysis",
            },
          ],
        })
        .do()
    }

    console.log("Weaviate schema initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing Weaviate schema:", error)
    throw error
  }
}
