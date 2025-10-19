"use client"

import { Menu, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"

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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
