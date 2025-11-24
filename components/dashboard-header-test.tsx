"use client"

import { Menu, Bell, User } from "lucide-react"

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="glass border-b border-border/50 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-card rounded-lg transition">
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold hidden md:block">Dashboard</h1>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-accent rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          <button className="p-2 hover:bg-accent rounded-lg">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
