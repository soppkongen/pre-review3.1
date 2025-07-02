import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Try to search knowledge base for relevant physics concepts
    let relevantKnowledge = ''
    let knowledgeUsed = false
    
    try {
      const searchResponse = await fetch(`${request.nextUrl.origin}/api/knowledge/search?q=${encodeURIComponent(message)}&limit=5`)
      if (searchResponse.ok) {
        const searchResults = await searchResponse.json()
        if (searchResults.success && searchResults.results.length > 0) {
          relevantKnowledge = searchResults.results
            .map((result: any) => `${result.title}: ${result.content}`)
            .join('\n\n')
          knowledgeUsed = true
        }
      }
    } catch (error) {
      console.log('Knowledge search failed, continuing with general physics knowledge:', error)
    }

    // Build conversation context
    const conversationHistory = history
      ?.slice(-6) // Last 6 messages for context
      ?.map((msg: Message) => `${msg.role}: ${msg.content}`)
      ?.join('\n') || ''

    // Create system prompt for physics research assistance
    const systemPrompt = `You are an expert physics research assistant specializing in helping researchers develop and refine their physics papers. You have extensive knowledge across all physics domains including:

- Classical Mechanics & Dynamics
- Quantum Mechanics & Quantum Field Theory  
- Electromagnetism & Optics
- Thermodynamics & Statistical Mechanics
- Relativity (Special & General)
- Particle Physics & High Energy Physics
- Condensed Matter Physics
- Astrophysics & Cosmology
- Mathematical Physics & Computational Methods

Your role is to:
- Provide expert guidance on theoretical physics concepts
- Help with mathematical derivations and proofs
- Suggest improvements to research methodology
- Identify potential issues or gaps in reasoning
- Offer insights from related physics domains
- Assist with paper structure and clarity
- Help develop theoretical frameworks
- Suggest experimental approaches when relevant

Guidelines:
- Be precise and scientifically accurate
- Reference established physics principles and recent developments
- Suggest specific improvements rather than general praise
- Ask clarifying questions when needed to better assist
- Maintain academic rigor while being helpful and encouraging
- Provide mathematical formulations when appropriate
- Consider interdisciplinary connections

${relevantKnowledge ? `Relevant physics knowledge from database:\n${relevantKnowledge}\n` : ''}

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ''}

Respond to the user's message with expert physics guidance:`

    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `${systemPrompt}\n\nUser: ${message}`,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return NextResponse.json({ 
      response: text,
      knowledgeUsed
    })

  } catch (error) {
    console.error('Theory Lab chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

