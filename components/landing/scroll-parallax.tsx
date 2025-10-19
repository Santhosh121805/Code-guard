"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface ScrollParallaxProps {
  children: React.ReactNode
  offset?: number
}

export function ScrollParallax({ children, offset = 0.5 }: ScrollParallaxProps) {
  const [translateY, setTranslateY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setTranslateY(window.scrollY * offset)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [offset])

  return <div style={{ transform: `translateY(${translateY}px)` }}>{children}</div>
}
