import { type NextRequest, NextResponse } from "next/server"
import { KnowledgeBaseService } from "@/lib/services/knowledge-base"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concept } = body

    if (!concept) {
      return NextResponse.json({ error: "Concept is required" }, { status: 400 })
    }

    const knowledgeBase = new KnowledgeBaseService()
    const explanation = await knowledgeBase.explainConcept(concept)

    return NextResponse.json({
      concept,
      explanation,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Explain concept error:", error)
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 })
  }
}
