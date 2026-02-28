import React from 'react';

interface DiagramProps {
  children: React.ReactNode;
}

export function Diagram({ children }: DiagramProps) {
  return (
    <div className="my-8 rounded-lg border border-foreground/10 bg-foreground/[0.03] overflow-x-auto">
      <pre className="p-6 text-xs leading-relaxed font-mono text-foreground/70 whitespace-pre">
        {children}
      </pre>
    </div>
  );
}
