"use client"

import { useState, useEffect } from "react"
import { GitBranch, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiClient, type Repository } from "@/lib/api"
import { AddRepositoryModal } from "./add-repository-modal"

export function RepositoryList() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.repositories.list()
      setRepositories(response.repositories || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch repositories:', err)
      setError('Failed to load repositories. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepositories()

    // Auto-refresh every 5 seconds to catch scanning status updates
    const interval = setInterval(() => {
      fetchRepositories()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleRepositoryAdded = () => {
    fetchRepositories() // Refresh immediately
    
    // Set up more frequent polling for the next 30 seconds to catch updates
    const quickInterval = setInterval(() => {
      fetchRepositories()
    }, 2000)
    
    setTimeout(() => {
      clearInterval(quickInterval)
    }, 30000)
  }

  return (
    <>
      <div className="glass rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Connected Repositories</h2>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Repository
          </Button>
        </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="text-muted-foreground">Loading repositories...</div>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <div className="text-destructive mb-2">⚠️ {error}</div>
          <div className="text-sm text-muted-foreground">
            Start the backend server: <code className="bg-card px-2 py-1 rounded">node backend/src/simple-test.js</code>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-sm text-muted-foreground">
                <th className="px-6 py-3 text-left font-medium">Repository</th>
                <th className="px-6 py-3 text-left font-medium">Vulnerabilities</th>
                <th className="px-6 py-3 text-left font-medium">Security Score</th>
                <th className="px-6 py-3 text-left font-medium">Last Scanned</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo) => (
                <tr key={repo.id} className="border-b border-border/50 hover:bg-card/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{repo.name}</div>
                        <div className="text-xs text-muted-foreground">{repo.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {repo.status === 'scanning' ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Scanning...
                      </div>
                    ) : (
                      <span className="text-destructive font-medium">{repo.vulnerabilities}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {repo.status === 'scanning' ? (
                      <div className="text-muted-foreground">Calculating...</div>
                    ) : (
                      <div className={`font-medium ${
                        (repo.securityScore || 0) >= 80 ? 'text-green-500' :
                        (repo.securityScore || 0) >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {repo.securityScore || 0}/100
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {repo.status === 'scanning' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                        {repo.lastScanned}
                      </div>
                    ) : (
                      repo.lastScanned
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
                      repo.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : repo.status === 'scanning'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {repo.status === 'scanning' && (
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {repo.status === 'scanning' ? 'Scanning...' : repo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/repository/${repo.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <AddRepositoryModal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      onRepositoryAdded={handleRepositoryAdded}
    />
  </>
)
}
