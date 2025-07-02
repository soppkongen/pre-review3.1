"use client";

import { useState } from "react";
import { UploadArea } from "@/components/analyzer/UploadArea";
import { AnalysisProgress } from "@/components/analyzer/AnalysisProgress";
import { ResultsDisplay } from "@/components/analyzer/ResultsDisplay";

interface AnalysisResult {
  agent: string;
  analysis: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

interface AnalysisResults {
  documentId: string;
  agentResults: AnalysisResult[];
  biasCheck: {
    passed: boolean;
    notes: string;
  };
  finalAnalysis: {
    overallScore: number;
    summary: string;
    recommendations: string[];
  };
}

export default function AnalyzerPage() {
  const [analysisState, setAnalysisState] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
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
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error('Analysis failed to start');
      }
      
      // Stream analysis results
      const reader = analysisResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }
      
      let finalResults = null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'complete') {
                finalResults = data.results;
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
      
      if (finalResults) {
        setAnalysisResults(finalResults);
        setAnalysisState('complete');
      }
      
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
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="hero">
        <h1>Serious review for serious thinkers.</h1>
        <p>Peer review meets epistemic counterintelligence.</p>
        
        {analysisState === 'idle' && (
          <div className="btn-primary inline-flex items-center gap-2 mt-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Start Review
          </div>
        )}
      </div>

      {/* How Pre-Review Works */}
      {analysisState === 'idle' && (
        <div className="mt-16">
          <h2 className="text-center mb-8">How Pre-Review Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our multi-agent system provides comprehensive analysis that goes beyond traditional peer review
          </p>
          
          <div className="feature-grid">
            <div className="feature-card card card-hover">
              <div className="feature-icon">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="mb-4">Submit Your Paper</h3>
              <p className="text-muted-foreground">
                Upload PDF, LaTeX, or DOCX files for comprehensive analysis
              </p>
            </div>
            
            <div className="feature-card card card-hover">
              <div className="feature-icon">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="mb-4">Epistemic Evaluation</h3>
              <p className="text-muted-foreground">
                Multi-agent system evaluates your work from multiple perspectives
              </p>
            </div>
            
            <div className="feature-card card card-hover">
              <div className="feature-icon">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="mb-4">Detailed Report</h3>
              <p className="text-muted-foreground">
                Receive comprehensive analysis with actionable insights
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {analysisState === 'idle' && (
        <div className="mt-16">
          <UploadArea onFileUpload={handleFileUpload} />
        </div>
      )}

      {/* Analysis Progress */}
      {(analysisState === 'uploading' || analysisState === 'analyzing') && (
        <AnalysisProgress 
          state={analysisState}
          fileName={uploadedFile?.name}
          onReset={handleReset}
        />
      )}

      {/* Results */}
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

