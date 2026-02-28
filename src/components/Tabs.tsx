'use client'

import React, { useState } from 'react'

interface TabsProps {
  children: React.ReactNode
}

interface TabProps {
  label: string
  children: React.ReactNode
}

export function Tabs({ children }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const childrenArray = React.Children.toArray(children)

  return (
    <div className="my-6 rounded-lg border border-foreground/10 overflow-hidden">
      <div className="flex border-b border-foreground/10 bg-foreground/5">
        {childrenArray.map((child, index) => {
          const tabChild = child as React.ReactElement<TabProps>
          return (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`px-4 py-3 text-sm font-medium transition-colors -mb-px ${
                activeIndex === index
                  ? 'text-accent border-b-2 border-accent bg-foreground/5'
                  : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5'
              }`}
            >
              {tabChild.props.label}
            </button>
          )
        })}
      </div>
      <div className="p-4">
        {childrenArray[activeIndex]}
      </div>
    </div>
  )
}

export function Tab({ children }: TabProps) {
  return <div>{children}</div>
}
