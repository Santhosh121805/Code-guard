"use client"

import { AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react"

const stats = [
  {
    icon: AlertTriangle,
    label: "Critical Issues",
    value: "12",
    change: "+2 this week",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: TrendingUp,
    label: "Total Vulnerabilities",
    value: "248",
    change: "-15 this week",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: CheckCircle,
    label: "Fixed Issues",
    value: "1,847",
    change: "+89 this week",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Clock,
    label: "Avg Fix Time",
    value: "2.4h",
    change: "-0.3h vs last week",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

export function StatsGrid() {
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
