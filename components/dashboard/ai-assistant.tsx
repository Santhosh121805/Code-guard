"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Sparkles } from "lucide-react"

export function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content:
        "Hi! I'm CodeGuardian AI. Ask me about vulnerabilities, security best practices, or remediation strategies.",
    },
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([...messages, { role: "user", content: input }])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm analyzing your question. Based on the vulnerabilities in your repositories, I recommend...",
        },
      ])
    }, 500)
  }

  return (
    <div className="glass rounded-lg flex flex-col h-full">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <Button size="sm" onClick={handleSend} className="bg-primary hover:bg-primary/90">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
