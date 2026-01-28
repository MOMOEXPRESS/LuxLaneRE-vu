"use client"

import { Grid3X3, Bookmark, Briefcase, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProfileTab = "posts" | "saved" | "portfolio" | "bookings"

interface ProfileTabsProps {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  isOwnProfile: boolean
  userRole: string
}

export function ProfileTabs({ activeTab, onTabChange, isOwnProfile, userRole }: ProfileTabsProps) {
  const tabs: { id: ProfileTab; icon: typeof Grid3X3; label: string; showFor?: string[] }[] = [
    { id: "posts", icon: Grid3X3, label: "Posts" },
    { id: "portfolio", icon: Briefcase, label: "Portfolio", showFor: ["model", "brand", "agency"] },
    { id: "bookings", icon: Calendar, label: "Bookings", showFor: ["model", "client"] },
    { id: "saved", icon: Bookmark, label: "Saved" },
  ]

  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "saved" && !isOwnProfile) return false
    if (tab.showFor && !tab.showFor.includes(userRole)) return false
    return true
  })

  return (
    <div className="flex border-b border-border/30">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors min-h-[44px]",
              isActive
                ? "border-gold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
