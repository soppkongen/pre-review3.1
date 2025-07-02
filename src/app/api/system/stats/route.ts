import { NextResponse } from "next/server"
import { getWeaviateClient } from "@/lib/weaviate"
import { KnowledgeBaseService } from "@/lib/services/knowledge-base"

export async function GET() {
  try {
    const client = getWeaviateClient()
    const knowledgeBase = new KnowledgeBaseService()

    // Get knowledge base stats
    const knowledgeStats = await knowledgeBase.getKnowledgeStats()

    // Get research papers count
    const papersResult = await client.graphql
      .aggregate()
      .withClassName("ResearchPaper")
      .withFields("meta { count }")
      .do()

    const totalPapers = papersResult.data?.Aggregate?.ResearchPaper?.[0]?.meta?.count || 0

    // Get analysis results count
    const analysisResult = await client.graphql
      .aggregate()
      .withClassName("AnalysisResult")
      .withFields("meta { count }")
      .do()

    const totalAnalyses = analysisResult.data?.Aggregate?.AnalysisResult?.[0]?.meta?.count || 0

    // Get recent activity (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recentPapers = await client.graphql
      .get()
      .withClassName("ResearchPaper")
      .withFields("uploadDate")
      .withWhere({
        path: ["uploadDate"],
        operator: "GreaterThan",
        valueText: yesterday.toISOString(),
      })
      .do()

    const recentUploads = recentPapers.data?.Get?.ResearchPaper?.length || 0

    return NextResponse.json({
      knowledge: {
        totalConcepts: knowledgeStats.totalConcepts,
        fieldDistribution: knowledgeStats.fieldDistribution,
        difficultyDistribution: knowledgeStats.difficultyDistribution,
      },
      papers: {
        total: totalPapers,
        recentUploads,
      },
      analyses: {
        total: totalAnalyses,
      },
      system: {
        status: "operational",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("System stats error:", error)
    return NextResponse.json(
      {
        error: "Failed to get system statistics",
        system: {
          status: "error",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
