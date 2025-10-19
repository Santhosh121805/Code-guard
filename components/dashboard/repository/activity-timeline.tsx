"use client"

import { CheckCircle, AlertCircle, GitCommit } from "lucide-react"

interface ActivityTimelineProps {
  repoId: string
}

const activities = [
  {
    type: "fixed",
    title: "SQL Injection Fixed",
    time: "2 hours ago",
    icon: CheckCircle,
  },
  {
    type: "detected",
    title: "XSS Vulnerability Detected",
    time: "5 hours ago",
    icon: AlertCircle,
  },
  {
    type: "scanned",
    title: "Repository Scanned",
    time: "1 day ago",
    icon: GitCommit,
  },
  {
    type: "fixed",
    title: "CSRF Token Validation Added",
    time: "2 days ago",
    icon: CheckCircle,
  },
  {
    type: "detected",
    title: "Weak Password Hashing Detected",
    time: "3 days ago",
    icon: AlertCircle,
  },
]

export function ActivityTimeline({ repoId }: ActivityTimelineProps) {
  return (
    <div className="glass p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-6">Activity Timeline</h2>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          const isLast = index === activities.length - 1

          return (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === "fixed"
                      ? "bg-accent/20"
                      : activity.type === "detected"
                        ? "bg-destructive/20"
                        : "bg-primary/20"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      activity.type === "fixed"
                        ? "text-accent"
                        : activity.type === "detected"
                          ? "text-destructive"
                          : "text-primary"
                    }`}
                  />
                </div>
                {!isLast && <div className="w-0.5 h-8 bg-border/50 mt-2" />}
              </div>

              <div className="flex-1 pt-1">
                <div className="font-medium text-sm">{activity.title}</div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
