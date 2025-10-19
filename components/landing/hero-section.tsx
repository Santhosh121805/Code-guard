"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"
import { AnimatedBackground } from "@/components/landing/animated-background"
import { FloatingOrbs } from "@/components/landing/floating-orbs"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <AnimatedBackground />
      <FloatingOrbs />

      {/* Background gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl opacity-20 animate-pulse" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="fade-in-down mb-6">
          <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary mb-4">
            Autonomous Code Security Platform
          </span>
        </div>

        <h1 className="fade-in text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text">Secure Your Code</span>
          <br />
          <span className="text-foreground">With AI Intelligence</span>
        </h1>

        <p className="fade-in-up text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          CodeGuardian AI automatically detects, analyzes, and remediates vulnerabilities in your codebase with
          enterprise-grade security powered by advanced AI.
        </p>

        <div className="fade-in-up flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
            <Play className="mr-2 w-4 h-4" />
            Watch Demo
          </Button>
        </div>

        {/* Stats preview */}
        <div className="fade-in-up grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">99.9%</div>
            <div className="text-xs text-muted-foreground">Detection Rate</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-accent">24/7</div>
            <div className="text-xs text-muted-foreground">Monitoring</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">Real-time</div>
            <div className="text-xs text-muted-foreground">Remediation</div>
          </div>
        </div>
      </div>
    </section>
  )
}
