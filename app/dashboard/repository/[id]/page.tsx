"use client"

import { useParams } from "next/navigation"

export default function RepositoryDetailPage() {
  const params = useParams()

  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto">
        <header className="border-b border-border/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <h1 className="text-xl font-bold">Repository Details</h1>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <h2 className="text-lg font-semibold mb-4">Repository ID: {params.id}</h2>
            <p className="text-muted-foreground">
              Repository analysis and vulnerability details will be displayed here.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="p-6 rounded-lg border bg-card text-card-foreground">
                <h3 className="text-md font-semibold mb-2">Vulnerability Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed vulnerability breakdown will appear here once the scanner is integrated.
                </p>
              </div>
            </div>
            <div>
              <div className="p-6 rounded-lg border bg-card text-card-foreground">
                <h3 className="text-md font-semibold mb-2">Activity Timeline</h3>
                <p className="text-muted-foreground text-sm">
                  Recent scanning activity will be shown here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
