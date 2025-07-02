import { NextRequest, NextResponse } from 'next/server'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, format = 'txt' } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    
    if (format === 'json') {
      const exportData = {
        exportedAt: timestamp,
        sessionType: 'theory-lab',
        messageCount: messages.length,
        messages: messages
      }

      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="theory-lab-chat-${timestamp.split('T')[0]}.json"`,
          'Content-Type': 'application/json'
        }
      })
    }

    // Default to text format
    const textContent = [
      `Physics Theory Lab Chat Session`,
      `Exported: ${new Date(timestamp).toLocaleString()}`,
      `Messages: ${messages.length}`,
      ``,
      `---`,
      ``,
      ...messages.map((msg: Message) => [
        `${msg.role.toUpperCase()} [${new Date(msg.timestamp).toLocaleTimeString()}]:`,
        msg.content,
        ``
      ]).flat(),
      `---`,
      ``,
      `End of session`
    ].join('\n')

    return new NextResponse(textContent, {
      headers: {
        'Content-Disposition': `attachment; filename="theory-lab-chat-${timestamp.split('T')[0]}.txt"`,
        'Content-Type': 'text/plain'
      }
    })

  } catch (error) {
    console.error('Chat export error:', error)
    return NextResponse.json(
      { error: 'Failed to export chat' },
      { status: 500 }
    )
  }
}

