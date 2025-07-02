import { type NextRequest, NextResponse } from "next/server"
import { DocumentProcessor } from "@/lib/services/document-processor"
import { getWeaviateClient } from "@/lib/weaviate"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const field = (formData.get("field") as string) || "physics"
    const keywords = (formData.get("keywords") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const processor = new DocumentProcessor()

    // Check file size
    if (file.size > processor.getMaxFileSize()) {
      return NextResponse.json({ error: "File size exceeds maximum limit (10MB)" }, { status: 400 })
    }

    // Check file type
    const supportedTypes = processor.getSupportedFileTypes()
    if (!supportedTypes.includes(file.type) && !supportedTypes.includes(processor["getFileTypeFromName"](file.name))) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // Process the document
    const processed = await processor.processDocument(file)

    // Extract authors from content (simple heuristic)
    const authors = this.extractAuthors(processed.content)

    // Extract abstract (simple heuristic)
    const abstract = this.extractAbstract(processed.content)

    // Store in Weaviate
    const client = getWeaviateClient()
    const result = await client.data
      .creator()
      .withClassName("ResearchPaper")
      .withProperties({
        title: processed.title,
        authors: authors,
        abstract: abstract,
        content: processed.content,
        field: field,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
        uploadDate: new Date().toISOString(),
        fileType: processed.metadata.fileType,
      })
      .do()

    return NextResponse.json({
      success: true,
      paperId: result.id,
      title: processed.title,
      metadata: processed.metadata,
      message: "Document uploaded and processed successfully",
    })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Failed to upload and process document" }, { status: 500 })
  }
}

function extractAuthors(content: string): string[] {
  // Simple heuristic to extract authors
  const lines = content.split("\n").slice(0, 20)

  for (const line of lines) {
    const trimmed = line.trim()
    // Look for patterns like "Author1, Author2" or "By Author Name"
    if (
      trimmed.toLowerCase().includes("author") ||
      (trimmed.includes(",") && trimmed.length < 200 && trimmed.length > 10)
    ) {
      const authors = trimmed
        .replace(/^(by|author[s]?:?)\s*/i, "")
        .split(/[,&]/)
        .map((a) => a.trim())
        .filter((a) => a.length > 2 && a.length < 50)

      if (authors.length > 0 && authors.length < 10) {
        return authors
      }
    }
  }

  return ["Unknown Author"]
}

function extractAbstract(content: string): string {
  // Look for abstract section
  const abstractMatch = content.match(/abstract[:\s]*(.*?)(?:\n\s*\n|\n\s*(?:introduction|keywords|1\.|i\.))/is)

  if (abstractMatch) {
    return abstractMatch[1].trim().substring(0, 1000)
  }

  // Fallback: use first paragraph
  const paragraphs = content.split("\n\n")
  for (const paragraph of paragraphs.slice(0, 5)) {
    const trimmed = paragraph.trim()
    if (trimmed.length > 100 && trimmed.length < 1000) {
      return trimmed
    }
  }

  return content.substring(0, 500) + "..."
}

export async function GET() {
  const processor = new DocumentProcessor()

  return NextResponse.json({
    supportedFileTypes: processor.getSupportedFileTypes(),
    maxFileSize: processor.getMaxFileSize(),
    maxFileSizeMB: processor.getMaxFileSize() / (1024 * 1024),
  })
}
