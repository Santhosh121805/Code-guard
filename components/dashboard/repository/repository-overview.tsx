"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, GitBranch, TrendingDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiClient } from "@/lib/api"

interface RepositoryOverviewProps {
  repoId: string
}

interface Repository {
  id: string
  name: string
  url: string
  vulnerabilities: number
  lastScanned: string
  status: string
  securityScore: number
}

interface VulnerabilitySummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export function RepositoryOverview({ repoId }: RepositoryOverviewProps) {
  const [repository, setRepository] = useState<Repository | null>(null)
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRepositoryData = async () => {
      try {
        setLoading(true)
        
        // Fetch repository details
        const repoResponse = await apiClient.repositories.get(repoId)
        setRepository(repoResponse.repository)
        
        // Fetch vulnerability summary
        try {
          const vulnResponse = await fetch(`/api/repositories/${repoId}/vulnerabilities`)
          if (vulnResponse.ok) {
            const vulnData = await vulnResponse.json()
            const vulnerabilities = vulnData.vulnerabilities || []
            
            // Calculate summary from vulnerabilities
            const summary = {
              total: vulnerabilities.length,
              critical: vulnerabilities.filter((v: any) => v.severity === 'critical').length,
              high: vulnerabilities.filter((v: any) => v.severity === 'high').length,
              medium: vulnerabilities.filter((v: any) => v.severity === 'medium').length,
              low: vulnerabilities.filter((v: any) => v.severity === 'low').length,
            }
            setVulnerabilities(summary)
          }
        } catch (vulnError) {
          console.log('Vulnerabilities not yet available for this repository')
          setVulnerabilities({ total: 0, critical: 0, high: 0, medium: 0, low: 0 })
        }
        
        setError(null)
      } catch (err) {
        console.error('Failed to fetch repository:', err)
        setError('Failed to load repository data')
      } finally {
        setLoading(false)
      }
    }

    if (repoId) {
      fetchRepositoryData()
    }
  }, [repoId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="glass p-8 rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading repository data...
          </div>
        </div>
      </div>
    )
  }

  if (error || !repository) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="glass p-8 rounded-lg">
          <div className="text-center text-destructive">
            {error || 'Repository not found'}
          </div>
        </div>
      </div>
    )
  }

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
              <h1 className="text-3xl font-bold">{repository.name}</h1>
              {repository.status === 'scanning' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </div>
              )}
            </div>
            <p className="text-muted-foreground">{repository.url}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Last Scanned</div>
            <div className="font-semibold">{repository.lastScanned}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Vulnerabilities</div>
            <div className="text-3xl font-bold">
              {repository.status === 'scanning' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Scanning...</span>
                </div>
              ) : (
                repository.vulnerabilities
              )}
            </div>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Critical Issues</div>
            <div className="text-3xl font-bold text-destructive">
              {repository.status === 'scanning' ? '-' : (vulnerabilities?.critical || 0)}
            </div>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">High Issues</div>
            <div className="text-3xl font-bold text-yellow-500">
              {repository.status === 'scanning' ? '-' : (vulnerabilities?.high || 0)}
            </div>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Security Score</div>
            <div className="flex items-center gap-2">
              {repository.status === 'scanning' ? (
                <span className="text-lg text-muted-foreground">Calculating...</span>
              ) : (
                <>
                  <span className={`text-3xl font-bold ${
                    repository.securityScore >= 80 ? 'text-green-500' :
                    repository.securityScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {repository.securityScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
