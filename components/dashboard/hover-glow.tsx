"use client"

import type React from "react"

import { type ReactNode, useState } from "react"

interface HoverGlowProps {
  children: ReactNode
  className?: string
}

export function HoverGlow({ children, className = "" }: HoverGlowProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(124, 58, 237, 0.1), transparent)`,
      }}
    >
      {children}
    </div>
  )
}
