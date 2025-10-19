import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
    description: "Perfect for small teams",
    features: [
      "Up to 5 repositories",
      "Real-time vulnerability detection",
      "Basic AI analysis",
      "Email support",
      "Monthly reports",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "/month",
    description: "For growing organizations",
    features: [
      "Unlimited repositories",
      "Advanced AI analysis",
      "Automated remediation",
      "Priority support",
      "Custom integrations",
      "Weekly reports",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large enterprises",
    features: [
      "Everything in Professional",
      "Dedicated support",
      "Custom AI models",
      "On-premise deployment",
      "SLA guarantee",
      "Advanced compliance",
      "Custom training",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your security needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-lg p-8 transition-all duration-300 ${
              plan.highlighted
                ? "glass border-primary/50 shadow-lg shadow-primary/20 scale-105"
                : "glass hover:border-primary/30"
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm ml-2">{plan.period}</span>
            </div>

            <Button
              className={`w-full mb-8 ${
                plan.highlighted ? "bg-primary hover:bg-primary/90" : "bg-primary/20 hover:bg-primary/30 text-primary"
              }`}
            >
              {plan.cta}
            </Button>

            <div className="space-y-3">
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-accent" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
