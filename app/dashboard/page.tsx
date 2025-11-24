"use client"

import { DashboardHeader } from "@/components/dashboard-header-test"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto">
        <DashboardHeader onMenuClick={() => {}} />
        <div className="p-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Testing dashboard header component from root...</p>
        </div>
      </main>
    </div>
  )
}
