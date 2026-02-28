import React from 'react'

interface ExpectedOutputProps {
  children: React.ReactNode
}

export function ExpectedOutput({ children }: ExpectedOutputProps) {
  return (
    <details className="my-4 rounded-lg border border-green-500/20 overflow-hidden">
      <summary className="px-4 py-3 bg-green-500/5 text-sm font-medium text-green-400 cursor-pointer hover:bg-green-500/10 transition-colors select-none">
        ✅ Expected Output
      </summary>
      <div className="p-4 bg-foreground/5 text-sm">
        {children}
      </div>
    </details>
  )
}
