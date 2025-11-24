"use client"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
            CodeGuardian AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Advanced AI-powered code security and vulnerability detection
          </p>
          <p className="text-lg text-muted-foreground">
            Application is loading...
          </p>
        </div>
      </div>
    </main>
  )
}
