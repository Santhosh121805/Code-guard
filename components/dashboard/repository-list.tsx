"use client"

import { GitBranch, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const repositories = [
  {
    id: 1,
    name: "auth-service",
    url: "github.com/company/auth-service",
    vulnerabilities: 8,
    lastScanned: "2 hours ago",
    status: "active",
  },
  {
    id: 2,
    name: "web-app",
    url: "github.com/company/web-app",
    vulnerabilities: 15,
    lastScanned: "1 hour ago",
    status: "active",
  },
  {
    id: 3,
    name: "api-gateway",
    url: "github.com/company/api-gateway",
    vulnerabilities: 3,
    lastScanned: "30 minutes ago",
    status: "active",
  },
  {
    id: 4,
    name: "mobile-app",
    url: "github.com/company/mobile-app",
    vulnerabilities: 12,
    lastScanned: "4 hours ago",
    status: "active",
  },
]

export function RepositoryList() {
  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border/50 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Connected Repositories</h2>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          Add Repository
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-sm text-muted-foreground">
              <th className="px-6 py-3 text-left font-medium">Repository</th>
              <th className="px-6 py-3 text-left font-medium">Vulnerabilities</th>
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
                  <span className="text-destructive font-medium">{repo.vulnerabilities}</span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{repo.lastScanned}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    {repo.status}
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
    </div>
  )
}
