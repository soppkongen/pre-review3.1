export interface ProcessedDocument {
  title: string
  content: string
  metadata: {
    fileType: string
    size: number
    pages?: number
    wordCount: number
  }
}

export class DocumentProcessor {
  async processDocument(file: File): Promise<ProcessedDocument> {
    const fileType = file.type || this.getFileTypeFromName(file.name)

    try {
      let content: string
      let title: string

      switch (fileType) {
        case "application/pdf":
          ;({ content, title } = await this.processPDF(file))
          break
        case "text/plain":
          ;({ content, title } = await this.processText(file))
          break
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          ;({ content, title } = await this.processDocx(file))
          break
        case "application/x-tex":
        case "text/x-tex":
          ;({ content, title } = await this.processTeX(file))
          break
        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }

      const wordCount = this.countWords(content)

      return {
        title: title || file.name,
        content,
        metadata: {
          fileType,
          size: file.size,
          wordCount,
        },
      }
    } catch (error) {
      console.error("Error processing document:", error)
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private async processPDF(file: File): Promise<{ content: string; title: string }> {
    // For now, we'll return a placeholder since PDF processing requires additional libraries
    // In a real implementation, you'd use libraries like pdf-parse or pdf2pic
    const content = `[PDF Content - ${file.name}]\n\nThis is a placeholder for PDF content extraction. In a production environment, this would contain the actual extracted text from the PDF file.`
    const title = file.name.replace(".pdf", "")

    return { content, title }
  }

  private async processText(file: File): Promise<{ content: string; title: string }> {
    const content = await file.text()
    const title = this.extractTitleFromText(content) || file.name.replace(".txt", "")

    return { content, title }
  }

  private async processDocx(file: File): Promise<{ content: string; title: string }> {
    // Placeholder for DOCX processing
    // In production, you'd use libraries like mammoth or docx-parser
    const content = `[DOCX Content - ${file.name}]\n\nThis is a placeholder for DOCX content extraction. In a production environment, this would contain the actual extracted text from the Word document.`
    const title = file.name.replace(".docx", "")

    return { content, title }
  }

  private async processTeX(file: File): Promise<{ content: string; title: string }> {
    const content = await file.text()
    const title = this.extractTitleFromTeX(content) || file.name.replace(/\.tex$/, "")

    return { content, title }
  }

  private extractTitleFromText(content: string): string | null {
    const lines = content.split("\n").slice(0, 10) // Check first 10 lines

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 10 && trimmed.length < 200) {
        // Likely a title if it's not too short or too long
        return trimmed
      }
    }

    return null
  }

  private extractTitleFromTeX(content: string): string | null {
    // Look for \title{...} command
    const titleMatch = content.match(/\\title\{([^}]+)\}/)
    if (titleMatch) {
      return titleMatch[1].trim()
    }

    // Look for \section{...} as fallback
    const sectionMatch = content.match(/\\section\{([^}]+)\}/)
    if (sectionMatch) {
      return sectionMatch[1].trim()
    }

    return null
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  private getFileTypeFromName(filename: string): string {
    const extension = filename.toLowerCase().split(".").pop()

    switch (extension) {
      case "pdf":
        return "application/pdf"
      case "txt":
        return "text/plain"
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      case "tex":
        return "application/x-tex"
      default:
        return "application/octet-stream"
    }
  }

  getSupportedFileTypes(): string[] {
    return [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/x-tex",
      "text/x-tex",
    ]
  }

  getMaxFileSize(): number {
    return 10 * 1024 * 1024 // 10MB
  }
}
