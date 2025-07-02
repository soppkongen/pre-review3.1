import { NextResponse } from 'next/server'

export async function GET() {
  const weaviateUrl = process.env.WEAVIATE_URL
  const apiKey = process.env.WEAVIATE_API_KEY

  const tests = [
    {
      name: 'Base URL',
      url: weaviateUrl,
      method: 'GET'
    },
    {
      name: 'Health Check',
      url: `${weaviateUrl}/v1/.well-known/ready`,
      method: 'GET'
    },
    {
      name: 'Live Check',
      url: `${weaviateUrl}/v1/.well-known/live`,
      method: 'GET'
    },
    {
      name: 'Meta Endpoint',
      url: `${weaviateUrl}/v1/meta`,
      method: 'GET'
    },
    {
      name: 'Schema Endpoint',
      url: `${weaviateUrl}/v1/schema`,
      method: 'GET'
    },
    {
      name: 'Objects Endpoint',
      url: `${weaviateUrl}/v1/objects`,
      method: 'GET'
    },
    {
      name: 'GraphQL Endpoint',
      url: `${weaviateUrl}/v1/graphql`,
      method: 'POST',
      body: JSON.stringify({
        query: '{ Get { __schema { types { name } } } }'
      })
    }
  ]

  const results = []

  for (const test of tests) {
    try {
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }

      if (test.body) {
        options.body = test.body
      }

      const response = await fetch(test.url!, options)
      const responseText = await response.text()
      
      results.push({
        name: test.name,
        url: test.url,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        response: responseText.substring(0, 500) // Limit response length
      })
    } catch (error) {
      results.push({
        name: test.name,
        url: test.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return NextResponse.json({ 
    cluster: weaviateUrl,
    results 
  })
}

