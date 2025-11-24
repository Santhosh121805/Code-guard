"use client"

import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { RepositoryOverview } from "@/components/dashboard/repository/repository-overview"
import { VulnerabilityBreakdown } from "@/components/dashboard/repository/vulnerability-breakdown"
import { ActivityTimeline } from "@/components/dashboard/repository/activity-timeline"
import { useState } from "react"

export default function RepositoryDetailPage() {
  const params = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 overflow-auto">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="p-6 space-y-6">
          <RepositoryOverview repoId={params.id as string} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VulnerabilityBreakdown repoId={params.id as string} />
            </div>
            <div>
              <ActivityTimeline repoId={params.id as string} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
