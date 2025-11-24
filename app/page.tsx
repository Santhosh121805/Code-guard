"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Simple Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/50' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CodeGuardian AI
            </div>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-6 text-center z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Secure Your Code with AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Advanced vulnerability scanning powered by artificial intelligence. 
            Protect your applications before they reach production.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="px-8 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition text-lg font-medium">
              Start Scanning
            </Link>
            <Link href="#features" className="px-8 py-4 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition text-lg font-medium">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Security Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive security analysis with cutting-edge AI technology
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-card border hover:border-primary/50 transition">
              <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Advanced machine learning algorithms detect vulnerabilities that traditional scanners miss.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border hover:border-primary/50 transition">
              <h3 className="text-xl font-semibold mb-3">Real-time Monitoring</h3>
              <p className="text-muted-foreground">
                Continuous monitoring of your repositories for new vulnerabilities and security threats.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border hover:border-primary/50 transition">
              <h3 className="text-xl font-semibold mb-3">Automated Fixes</h3>
              <p className="text-muted-foreground">
                Intelligent suggestions and automated patches for common security vulnerabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            CodeGuardian AI
          </div>
          <p className="text-muted-foreground">
            © 2025 CodeGuardian AI. Protecting your code with artificial intelligence.
          </p>
        </div>
      </footer>
    </main>
  )
}
