import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
      <div className="glass p-12 rounded-lg border-primary/30">
        <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Code?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of developers and enterprises using CodeGuardian AI to protect their codebase.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
            Schedule a Demo
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">No credit card required. 14-day free trial.</p>
      </div>
    </section>
  )
}
