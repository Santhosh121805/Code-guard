"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LayoutDashboard, GitBranch, AlertCircle, Settings, LogOut, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: GitBranch, label: "Repositories", href: "/dashboard/repositories" },
    { icon: AlertCircle, label: "Vulnerabilities", href: "/dashboard/vulnerabilities" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          !isOpen ? "-ml-64" : ""
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-bold text-lg">CodeGuardian</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onToggle} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="p-6 border-b border-sidebar-border flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <span className="font-bold text-lg">CodeGuardian</span>
              </Link>
              <button onClick={onToggle} className="p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={onToggle}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 ${
                        isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
