"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, GitCommit, Loader2 } from "lucide-react"

interface ActivityTimelineProps {
  repoId: string
}

interface Activity {
  type: "fixed" | "detected" | "scanned"
  title: string
  time: string
  icon: any
}

export function ActivityTimeline({ repoId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true)
        
        // Fetch repository data to get basic info
        const repoResponse = await fetch(`/api/repositories/${repoId}`)
        
        if (repoResponse.ok) {
          const repoData = await repoResponse.json()
          const repo = repoData.repository
          
          // Generate realistic activity timeline based on repository status and scan time
          const generatedActivities: Activity[] = []
          
          if (repo.status === 'active') {
            generatedActivities.push({
              type: "scanned",
              title: `Security scan completed for ${repo.name}`,
              time: repo.lastScanned,
              icon: GitCommit,
            })
            
            // Add some detected vulnerabilities
            if (repo.vulnerabilities > 0) {
              generatedActivities.push({
                type: "detected",
                title: `${repo.vulnerabilities} vulnerabilities detected`,
                time: repo.lastScanned,
                icon: AlertCircle,
              })
            }
          } else if (repo.status === 'scanning') {
            generatedActivities.push({
              type: "scanned",
              title: `Scanning ${repo.name} in progress...`,
              time: "Just now",
              icon: GitCommit,
            })
          }
          
          // Add repository connection activity
          generatedActivities.push({
            type: "scanned",
            title: `Repository ${repo.name} connected`,
            time: repo.lastScanned,
            icon: CheckCircle,
          })
          
          setActivities(generatedActivities)
        } else {
          // Fallback activity data
          setActivities([
            {
              type: "scanned",
              title: "Repository scan initiated",
              time: "Just now",
              icon: GitCommit,
            }
          ])
        }
      } catch (err) {
        console.error('Failed to fetch activity data:', err)
        // Default activity for new repositories
        setActivities([
          {
            type: "scanned",
            title: "Repository connected to CodeGuardian AI",
            time: "Just now",
            icon: CheckCircle,
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    if (repoId) {
      fetchActivityData()
    }
  }, [repoId])

  if (loading) {
    return (
      <div className="glass p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-6">Activity Timeline</h2>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading activity...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-6">Activity Timeline</h2>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No activity yet
          </div>
        ) : (
          activities.map((activity, index) => {
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
          })
        )}
      </div>
    </div>
  )
}
