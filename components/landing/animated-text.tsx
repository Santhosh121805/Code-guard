"use client"

import { useEffect, useRef } from "react"

interface AnimatedTextProps {
  text: string
  className?: string
}

export function AnimatedText({ text, className = "" }: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const letters = element.querySelectorAll("span")
    letters.forEach((letter, index) => {
      letter.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s both`
    })
  }, [])

  return (
    <div ref={ref} className={className}>
      {text.split("").map((char, index) => (
        <span key={index} style={{ display: "inline-block" }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  )
}
