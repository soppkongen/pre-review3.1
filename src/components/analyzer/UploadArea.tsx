"use client";

import { useCallback, useState } from "react";

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
}

export function UploadArea({ onFileUpload }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <svg
            className="w-16 h-16 text-muted-foreground mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <h3 className="text-xl font-semibold mb-2">Upload Physics Paper</h3>
          <p className="text-muted-foreground mb-6 text-center">
            Drag and drop your PDF file here, or click to select
          </p>
          
          <label className="btn-primary cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            Select PDF File
          </label>
          
          <p className="text-sm text-muted-foreground mt-4">
            Supports PDF files up to 10MB
          </p>
        </div>
      </div>
    </div>
  );
}

