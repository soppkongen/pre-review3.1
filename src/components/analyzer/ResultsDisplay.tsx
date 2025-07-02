"use client";

interface AnalysisResult {
  agent: string;
  analysis: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

interface ResultsDisplayProps {
  results: {
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
  };
  fileName?: string;
  onReset: () => void;
}

export function ResultsDisplay({ results, fileName, onReset }: ResultsDisplayProps) {
  const handleExportResults = () => {
    const exportData = {
      fileName,
      timestamp: new Date().toISOString(),
      ...results
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `physics-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Analysis Complete
              </h2>
              {fileName && (
                <p className="text-gray-600">
                  Analysis of: {fileName}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExportResults}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Export Results
              </button>
              <button
                onClick={onReset}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Analyze Another Paper
              </button>
            </div>
          </div>
        </div>

        {/* Final Analysis Summary */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Overall Assessment
          </h3>
          <div className="flex items-center mb-4">
            <span className="text-sm text-gray-600 mr-2">Overall Score:</span>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${results.finalAnalysis.overallScore}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {results.finalAnalysis.overallScore}/100
              </span>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            {results.finalAnalysis.summary}
          </p>
          {results.finalAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Recommendations:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {results.finalAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bias Check */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bias Assessment
          </h3>
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              results.biasCheck.passed ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium">
              {results.biasCheck.passed ? 'No significant bias detected' : 'Potential bias flagged'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {results.biasCheck.notes}
          </p>
        </div>

        {/* Agent Results */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Detailed Agent Analysis
          </h3>
          <div className="space-y-6">
            {results.agentResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">
                    {result.agent}
                  </h4>
                  <span className="text-sm text-gray-600">
                    Score: {result.score}/100
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">
                  {result.analysis}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {result.strengths.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">
                        Strengths:
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {result.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.weaknesses.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-red-800 mb-2">
                        Areas for Improvement:
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {result.weaknesses.map((weakness, idx) => (
                          <li key={idx}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

