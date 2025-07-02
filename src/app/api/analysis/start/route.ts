import { type NextRequest, NextResponse } from "next/server"
import { AgentOrchestrator } from "@/lib/services/agent-orchestrator"
import { getWeaviateClient } from "@/lib/weaviate"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paperId, analysisTypes } = body

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 })
    }

    // Get the paper from Weaviate
    const client = getWeaviateClient()
    const paperResult = await client.graphql
      .get()
      .withClassName("ResearchPaper")
      .withFields("title authors abstract content field keywords uploadDate fileType")
      .withWhere({
        path: ["id"],
        operator: "Equal",
        valueText: paperId,
      })
      .do()

    const papers = paperResult.data?.Get?.ResearchPaper
    if (!papers || papers.length === 0) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    }

    const paper = papers[0]
    const orchestrator = new AgentOrchestrator()

    const analysisId = await orchestrator.startAnalysis({
      paperId,
      paper,
      analysisTypes: analysisTypes || ["comprehensive"],
    })

    return NextResponse.json({
      success: true,
      analysisId,
      message: "Analysis started successfully",
    })
  } catch (error) {
    console.error("Start analysis error:", error)
    return NextResponse.json({ error: "Failed to start analysis" }, { status: 500 })
  }
}
