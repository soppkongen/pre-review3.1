import { type NextRequest, NextResponse } from "next/server"
import { KnowledgeBaseService } from "@/lib/services/knowledge-base-fixed"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const knowledgeBase = new KnowledgeBaseService()
    const results = await knowledgeBase.searchKnowledge(query, limit)

    return NextResponse.json({
      query,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error("Knowledge search error:", error)
    return NextResponse.json({ error: "Failed to search knowledge base" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concept, description, field, difficulty, equations, applications, relatedConcepts, examples } = body

    if (!concept || !description || !field) {
      return NextResponse.json({ error: "Concept, description, and field are required" }, { status: 400 })
    }

    const knowledgeBase = new KnowledgeBaseService()
    const id = await knowledgeBase.addKnowledge({
      concept,
      description,
      field,
      difficulty: difficulty || "intermediate",
      equations: equations || [],
      applications: applications || [],
      relatedConcepts: relatedConcepts || [],
      examples: examples || [],
    })

    return NextResponse.json({
      success: true,
      id,
      message: "Knowledge added successfully",
    })
  } catch (error) {
    console.error("Add knowledge error:", error)
    return NextResponse.json({ error: "Failed to add knowledge" }, { status: 500 })
  }
}
