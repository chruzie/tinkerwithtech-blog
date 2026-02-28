import React from 'react'

interface StepProps {
  number: number
  title: string
  time?: string
  children: React.ReactNode
}

export function Step({ number, title, time, children }: StepProps) {
  return (
    <div className="my-10">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded shrink-0">
          {String(number).padStart(2, '0')}
        </span>
        <h3 className="text-lg font-semibold text-secondary">{title}</h3>
        {time && (
          <span className="text-xs text-foreground/40 font-mono ml-auto shrink-0">{time}</span>
        )}
      </div>
      <div className="pl-9 space-y-4 border-l border-foreground/10">
        {children}
      </div>
    </div>
  )
}
