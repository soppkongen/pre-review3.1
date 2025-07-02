import type { NextRequest } from "next/server"
import { AgentOrchestrator } from "@/lib/services/agent-orchestrator"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paperContent = searchParams.get("paperContent")
  const paperTitle = searchParams.get("paperTitle")

  if (!paperContent || !paperTitle) {
    return new Response("Missing required parameters", { status: 400 })
  }

  const encoder = new TextEncoder()
  let isCompleted = false
  
  const stream = new ReadableStream({
    async start(controller) {
      // Set up timeout to prevent infinite streams
      const timeout = setTimeout(() => {
        if (!isCompleted) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Analysis timeout - please try again",
              })}\n\n`,
            ),
          )
          controller.close()
          isCompleted = true
        }
      }, 300000) // 5 minute timeout

      try {
        const orchestrator = new AgentOrchestrator()
        const agents = orchestrator.getAgents()

        // Send initial message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "analysis-start",
              message: "Starting multi-agent analysis...",
              totalAgents: agents.length,
            })}\n\n`,
          ),
        )

        // Process each agent with error handling
        for (let i = 0; i < agents.length && !isCompleted; i++) {
          const agent = agents[i]

          try {
            // Send progress update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "agent-start",
                  agentId: agent.id,
                  agentName: agent.name,
                  progress: Math.round((i / agents.length) * 100),
                })}\n\n`,
              ),
            )

            // Add timeout for individual agent analysis
            const agentTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Agent timeout")), 60000) // 1 minute per agent
            })

            const analysisPromise = orchestrator.analyzeWithAgent(agent.id, paperContent, paperTitle)
            
            const result = await Promise.race([analysisPromise, agentTimeout])

            if (!isCompleted) {
              // Send agent result in chunks to prevent large payloads
              const resultText = typeof result === 'string' ? result : result.analysis || 'Analysis completed'
              const chunks = resultText.match(/.{1,500}/g) || [resultText]
              
              for (const chunk of chunks) {
                if (!isCompleted) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "analysis-chunk",
                        agentId: agent.id,
                        chunk: chunk,
                        timestamp: new Date().toISOString(),
                      })}\n\n`,
                    ),
                  )
                }
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "agent-complete",
                    agentId: agent.id,
                    agentName: agent.name,
                  })}\n\n`,
                ),
              )
            }
          } catch (error) {
            console.error(`Agent ${agent.id} failed:`, error)
            if (!isCompleted) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "agent-error",
                    agentId: agent.id,
                    error: error instanceof Error ? error.message : "Analysis failed",
                  })}\n\n`,
                ),
              )
            }
          }
        }

        // Send completion message
        if (!isCompleted) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "analysis-complete",
                message: "Multi-agent analysis completed",
              })}\n\n`,
            ),
          )
        }
      } catch (error) {
        console.error("Stream error:", error)
        if (!isCompleted) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Analysis failed",
              })}\n\n`,
            ),
          )
        }
      } finally {
        clearTimeout(timeout)
        isCompleted = true
        controller.close()
      }
    },
    
    cancel() {
      isCompleted = true
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
