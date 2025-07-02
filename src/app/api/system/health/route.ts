import { NextResponse } from "next/server"
import { getWeaviateClient } from "@/lib/weaviate"

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      weaviate: "unknown",
      openai: "unknown",
    },
    version: "1.0.0",
  }

  try {
    // Check Weaviate connection
    const client = getWeaviateClient()
    await client.misc.metaGetter().do()
    health.services.weaviate = "healthy"
  } catch (error) {
    console.error("Weaviate health check failed:", error)
    health.services.weaviate = "unhealthy"
    health.status = "degraded"
  }

  try {
    // Check OpenAI API key presence
    if (process.env.OPENAI_API_KEY) {
      health.services.openai = "configured"
    } else {
      health.services.openai = "not configured"
      health.status = "degraded"
    }
  } catch (error) {
    console.error("OpenAI health check failed:", error)
    health.services.openai = "error"
    health.status = "degraded"
  }

  const statusCode = health.status === "healthy" ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
