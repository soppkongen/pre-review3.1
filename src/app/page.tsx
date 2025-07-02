"use client";

import { useState } from "react";
import { UploadArea } from "@/components/analyzer/UploadArea";
import { AnalysisProgress } from "@/components/analyzer/AnalysisProgress";
import { ResultsDisplay } from "@/components/analyzer/ResultsDisplay";

export default function AnalyzerPage() {
  const [analysisState, setAnalysisState] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setAnalysisState('uploading');
    
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Start analysis
      setAnalysisState('analyzing');
      
      const analysisResponse = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: uploadResult.documentId,
          analysisType: 'multi-agent'
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error('Analysis failed to start');
      }
      
      const analysisResult = await analysisResponse.json();
      setAnalysisResults(analysisResult);
      setAnalysisState('complete');
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisState('idle');
    }
  };

  const handleReset = () => {
    setAnalysisState('idle');
    setAnalysisResults(null);
    setUploadedFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Physics Paper Analyzer
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your physics paper for comprehensive multi-agent analysis. 
          Our system evaluates your work from multiple perspectives to provide 
          unbiased, thorough feedback.
        </p>
      </div>

      {analysisState === 'idle' && (
        <UploadArea onFileUpload={handleFileUpload} />
      )}

      {(analysisState === 'uploading' || analysisState === 'analyzing') && (
        <AnalysisProgress 
          state={analysisState}
          fileName={uploadedFile?.name}
          onReset={handleReset}
        />
      )}

      {analysisState === 'complete' && analysisResults && (
        <ResultsDisplay 
          results={analysisResults}
          fileName={uploadedFile?.name}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

