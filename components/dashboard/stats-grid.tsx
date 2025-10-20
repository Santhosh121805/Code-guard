"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api"

export function StatsGrid() {
  const [stats, setStats] = useState([
    {
      icon: AlertTriangle,
      label: "Critical Issues",
      value: "...",
      change: "Loading...",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      icon: TrendingUp,
      label: "Total Vulnerabilities", 
      value: "...",
      change: "Loading...",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: CheckCircle,
      label: "Fixed Issues",
      value: "...",
      change: "Loading...",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Clock,
      label: "Total Repositories",
      value: "...",
      change: "Loading...",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.dashboard.stats()
        
        setStats([
          {
            icon: AlertTriangle,
            label: "Critical Issues",
            value: response.criticalIssues.toString(),
            change: "+2 this week",
            color: "text-destructive",
            bgColor: "bg-destructive/10",
          },
          {
            icon: TrendingUp,
            label: "Total Vulnerabilities",
            value: response.totalVulnerabilities.toString(),
            change: "-15 this week", 
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            icon: CheckCircle,
            label: "Fixed Issues",
            value: response.resolvedIssues.toString(),
            change: "+89 this week",
            color: "text-accent",
            bgColor: "bg-accent/10",
          },
          {
            icon: Clock,
            label: "Total Repositories",
            value: response.totalRepositories.toString(),
            change: "Connected",
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
        ])
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
        // Keep loading state on error
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="glass p-6 rounded-lg hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-sm text-muted-foreground mb-1">{stat.label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.change}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
