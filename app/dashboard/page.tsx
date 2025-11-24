"use client"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto">
        <header className="border-b border-border/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-lg border bg-card text-card-foreground">
              <h3 className="text-sm text-muted-foreground mb-1">Critical Issues</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            </div>
            <div className="p-6 rounded-lg border bg-card text-card-foreground">
              <h3 className="text-sm text-muted-foreground mb-1">Total Vulnerabilities</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            </div>
            <div className="p-6 rounded-lg border bg-card text-card-foreground">
              <h3 className="text-sm text-muted-foreground mb-1">Fixed Issues</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            </div>
            <div className="p-6 rounded-lg border bg-card text-card-foreground">
              <h3 className="text-sm text-muted-foreground mb-1">Total Repositories</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <h2 className="text-lg font-semibold mb-4">Welcome to CodeGuardian AI</h2>
            <p className="text-muted-foreground">
              Your security vulnerability scanner is ready to analyze repositories and protect your code.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
