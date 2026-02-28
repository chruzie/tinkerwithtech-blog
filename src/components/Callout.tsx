import React from 'react'

interface CalloutProps {
  type?: 'info' | 'tip' | 'warning' | 'check' | 'success'
  children: React.ReactNode
}

const styles = {
  info: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    icon: 'ℹ️',
    text: 'text-blue-400',
  },
  tip: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    icon: '💡',
    text: 'text-purple-400',
  },
  warning: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    icon: '⚠️',
    text: 'text-yellow-400',
  },
  check: {
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    icon: '✅',
    text: 'text-green-400',
  },
  success: {
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    icon: '🎉',
    text: 'text-green-400',
  },
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const style = styles[type]

  return (
    <div className={`my-6 rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex gap-3">
        <span className="text-lg flex-shrink-0">{style.icon}</span>
        <div className="text-sm text-foreground/85">{children}</div>
      </div>
    </div>
  )
}
