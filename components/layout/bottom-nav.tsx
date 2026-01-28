"use client"

import { useAuth } from "@/lib/auth-context"
import { getNavTabs, type TabId } from "@/lib/navigation"

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  unreadCount?: number
}

export function BottomNav({ activeTab, onTabChange, unreadCount = 0 }: BottomNavProps) {
  const { user } = useAuth()
  const tabs = getNavTabs(user?.role || "model")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom pointer-events-auto">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative touch-manipulation ${
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
              }`}
              style={{ minHeight: "44px" }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.id === "inbox" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-foreground" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
