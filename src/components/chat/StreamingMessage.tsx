'use client'

import { useEffect, useRef } from 'react'

export function StreamingMessage({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }, [text])

  return (
    <div className="flex gap-3 px-4 py-3 motion-reduce:transform-none motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium shrink-0">
        AI
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {text}
          <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 animate-pulse" />
        </p>
      </div>
      <div ref={ref} />
    </div>
  )
}