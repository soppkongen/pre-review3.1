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


