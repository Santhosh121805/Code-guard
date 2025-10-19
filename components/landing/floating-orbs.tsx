"use client"

import { useEffect, useRef } from "react"

interface Orb {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

export function FloatingOrbs() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const orbs: Orb[] = [
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 100,
        color: "rgba(124, 58, 237, 0.1)",
      },
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 150,
        color: "rgba(6, 246, 255, 0.08)",
      },
    ]

    const animate = () => {
      orbs.forEach((orb) => {
        orb.x += orb.vx
        orb.y += orb.vy

        if (orb.x - orb.radius < 0 || orb.x + orb.radius > window.innerWidth) orb.vx *= -1
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > window.innerHeight) orb.vy *= -1

        const element = container.querySelector(`[data-orb="${orbs.indexOf(orb)}"]`) as HTMLElement
        if (element) {
          element.style.transform = `translate(${orb.x - orb.radius}px, ${orb.y - orb.radius}px)`
        }
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none">
      <div
        data-orb="0"
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(124, 58, 237, 0.1)" }}
      />
      <div
        data-orb="1"
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(6, 246, 255, 0.08)" }}
      />
    </div>
  )
}
