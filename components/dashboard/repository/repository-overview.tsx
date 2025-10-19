"use client"

import { ArrowLeft, GitBranch, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface RepositoryOverviewProps {
  repoId: string
}

export function RepositoryOverview({ repoId }: RepositoryOverviewProps) {
  return (
    <div className="space-y-4">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="glass p-8 rounded-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GitBranch className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">auth-service</h1>
            </div>
            <p className="text-muted-foreground">github.com/company/auth-service</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Last Scanned</div>
            <div className="font-semibold">2 hours ago</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Vulnerabilities</div>
            <div className="text-3xl font-bold">8</div>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Critical Issues</div>
            <div className="text-3xl font-bold text-destructive">2</div>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Fixed This Month</div>
            <div className="text-3xl font-bold text-accent">5</div>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Security Score</div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">78</span>
              <span className="text-xs text-accent flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                -5%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
