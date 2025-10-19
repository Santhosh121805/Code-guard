export function StatsSection() {
  const stats = [
    { label: "Vulnerabilities Detected", value: "2.4M+" },
    { label: "Code Repositories Secured", value: "50K+" },
    { label: "Security Issues Fixed", value: "1.8M+" },
    { label: "Enterprise Customers", value: "500+" },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
