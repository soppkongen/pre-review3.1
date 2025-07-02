import { NextRequest, NextResponse } from "next/server"
import { DocumentProcessor } from "@/lib/services/document-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    const processor = new DocumentProcessor()
    const result = await processor.processDocument(file)

    return NextResponse.json({
      success: true,
      title: result.title,
      content: result.content,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Failed to upload and process document" }, { status: 500 })
  }
}

