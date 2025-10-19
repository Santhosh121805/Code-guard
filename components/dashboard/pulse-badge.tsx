"use client"

import type React from "react"

interface PulseBadgeProps {
  children: React.ReactNode
  variant?: "critical" | "warning" | "success"
}

export function PulseBadge({ children, variant = "critical" }: PulseBadgeProps) {
  const variantClasses = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    warning: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${variantClasses[variant]} animate-pulse`}
    >
      <span
        className={`w-2 h-2 rounded-full ${variant === "critical" ? "bg-destructive" : variant === "warning" ? "bg-orange-400" : "bg-green-400"}`}
      />
      {children}
    </div>
  )
}
