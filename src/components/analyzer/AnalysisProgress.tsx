"use client";

interface AnalysisProgressProps {
  state: 'uploading' | 'analyzing';
  fileName?: string;
  onReset: () => void;
}

export function AnalysisProgress({ state, fileName, onReset }: AnalysisProgressProps) {
  const agents = [
    'Classical Mechanics Agent',
    'Quantum Mechanics Agent', 
    'Electromagnetism Agent',
    'Thermodynamics Agent',
    'Relativity Agent',
    'Mathematical Physics Agent',
    'Experimental Physics Agent'
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {state === 'uploading' ? 'Uploading Document' : 'Multi-Agent Analysis in Progress'}
          </h2>
          {fileName && (
            <p className="text-gray-600">
              Processing: {fileName}
            </p>
          )}
        </div>

        {state === 'uploading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center text-gray-600">
              Uploading and extracting content from your PDF...
            </p>
          </div>
        )}

        {state === 'analyzing' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Analyzing with 7 specialized agents
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Analysis Progress:
              </h3>
              {agents.map((agent) => (
                <div key={agent} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="animate-pulse">
                      <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{agent}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Each agent analyzes your paper from their specialized perspective. 
                This comprehensive approach ensures thorough, unbiased evaluation.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

