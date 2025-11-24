"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { RepositoryList } from "@/components/dashboard/repository-list"
import { VulnerabilityTable } from "@/components/dashboard/vulnerability-table"
import { AIAssistant } from "@/components/dashboard/ai-assistant"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useState } from "react"

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 overflow-auto">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="p-6 space-y-6">
          <StatsGrid />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VulnerabilityTable />
            </div>
            <div>
              <AIAssistant />
            </div>
          </div>
          <RepositoryList />
        </div>
      </main>
    </div>
  )
}
