"use client"

import { Home, Search, PlusSquare, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils"

export type NavTab = "feed" | "explore" | "create" | "marketplace" | "profile"

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

const navItems: { id: NavTab; icon: typeof Home; label: string }[] = [
  { id: "feed", icon: Home, label: "Home" },
  { id: "explore", icon: Search, label: "Explore" },
  { id: "create", icon: PlusSquare, label: "Create" },
  { id: "marketplace", icon: ShoppingBag, label: "Market" },
  { id: "profile", icon: User, label: "Profile" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const isCreate = item.id === "create"

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] transition-all",
                isCreate && "relative",
              )}
            >
              {isCreate ? (
                <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <Icon className={cn("h-6 w-6 transition-colors", isActive ? "text-gold" : "text-muted-foreground")} />
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors",
                      isActive ? "text-gold" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
