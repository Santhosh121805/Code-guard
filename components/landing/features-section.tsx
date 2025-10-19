import { Shield, Zap, Brain, Code2, GitBranch, AlertCircle } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning models analyze your code for vulnerabilities and security risks.",
  },
  {
    icon: Zap,
    title: "Real-time Detection",
    description: "Instant vulnerability detection as you commit code to your repositories.",
  },
  {
    icon: Code2,
    title: "Automated Remediation",
    description: "AI-generated fixes and patches for identified security issues.",
  },
  {
    icon: GitBranch,
    title: "Multi-Repository Support",
    description: "Seamlessly integrate with GitHub, GitLab, and Bitbucket.",
  },
  {
    icon: AlertCircle,
    title: "Smart Alerts",
    description: "Intelligent prioritization of vulnerabilities based on severity and exploitability.",
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "Meet OWASP, CWE, and industry compliance standards automatically.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to secure your codebase with enterprise-grade AI security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="glass p-6 rounded-lg hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/30 transition">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
