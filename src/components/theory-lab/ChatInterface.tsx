"use client";

interface ChatInterfaceProps {
  children: React.ReactNode;
}

export function ChatInterface({ children }: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-96">
      {children}
    </div>
  );
}

