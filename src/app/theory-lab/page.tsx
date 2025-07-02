"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/theory-lab/ChatInterface";
import { MessageHistory } from "@/components/theory-lab/MessageHistory";
import { MessageInput } from "@/components/theory-lab/MessageInput";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TheoryLabPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to the Theory Lab! I\'m here to help you develop and refine your physics papers. I have access to a comprehensive knowledge base of 36,600+ physics concepts and can assist with theoretical development, mathematical derivations, and research guidance. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/theory-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportChat = () => {
    const chatContent = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theory-lab-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Welcome to the Theory Lab! I\'m here to help you develop and refine your physics papers. I have access to a comprehensive knowledge base of 36,600+ physics concepts and can assist with theoretical development, mathematical derivations, and research guidance. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Theory Lab
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Collaborate with our AI assistant to develop and refine your physics papers. 
          Access our comprehensive knowledge base and get expert guidance on theoretical concepts.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Chat Session</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleExportChat}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <ChatInterface>
          <MessageHistory messages={messages} isLoading={isLoading} />
          <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </ChatInterface>
      </div>
    </div>
  );
}

