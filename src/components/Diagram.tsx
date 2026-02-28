'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface DiagramProps {
  children: string
}

export function Diagram({ children }: DiagramProps) {
  const id = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const definition = typeof children === 'string' ? children.trim() : ''
    if (!definition || !containerRef.current) return

    let cancelled = false

    async function render() {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          background: '#2d2834',
          primaryColor: '#3d3344',
          primaryTextColor: '#c9bea5',
          primaryBorderColor: '#c9bea5',
          lineColor: '#c9bea5',
          secondaryColor: '#3d3344',
          tertiaryColor: '#3d3344',
          edgeLabelBackground: '#2d2834',
          nodeTextColor: '#c9bea5',
          clusterBkg: '#38303f',
          clusterBorder: '#c9bea5',
          titleColor: '#c9bea5',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '13px',
        },
      })

      try {
        // SVG is generated entirely by the mermaid library from a diagram definition string
        const result = await mermaid.render(`mermaid-${id}`, definition)
        if (!cancelled && containerRef.current) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(result.svg, 'image/svg+xml')
          const svgEl = doc.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
            containerRef.current.replaceChildren(svgEl)
          }
          setReady(true)
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }

    render()
    return () => { cancelled = true }
  }, [children, id])

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 font-mono">
        Diagram error: {error}
      </div>
    )
  }

  return (
    <div className="my-8 rounded-lg border border-foreground/10 bg-foreground/3 p-6 overflow-x-auto flex justify-center">
      <div
        ref={containerRef}
        className="w-full flex justify-center"
        aria-hidden={!ready}
      >
        {!ready && (
          <span className="text-xs text-foreground/30 font-mono py-10 block">rendering diagram…</span>
        )}
      </div>
    </div>
  )
}
