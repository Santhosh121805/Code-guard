export function TechStackSection() {
  const techs = [
    { name: "React", icon: "⚛️" },
    { name: "TypeScript", icon: "📘" },
    { name: "TailwindCSS", icon: "🎨" },
    { name: "Framer Motion", icon: "✨" },
    { name: "React Three Fiber", icon: "🎭" },
    { name: "Recharts", icon: "📊" },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Built With Modern Tech</h2>
        <p className="text-muted-foreground">Powered by the latest web technologies</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {techs.map((tech, index) => (
          <div
            key={index}
            className="glass px-6 py-3 rounded-lg flex items-center gap-2 hover:border-primary/50 transition"
          >
            <span className="text-2xl">{tech.icon}</span>
            <span className="font-medium">{tech.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
