"use client"

import { Bell, MessageCircle } from "lucide-react"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"

interface FeedHeaderProps {
  unreadMessages: number
  unreadNotifications: number
  onMessagesClick: () => void
  onNotificationsClick: () => void
}

export function FeedHeader({
  unreadMessages,
  unreadNotifications,
  onMessagesClick,
  onNotificationsClick,
}: FeedHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="flex items-center justify-between h-14 px-4">
        <LuxlaneLogo size="sm" />

        <div className="flex items-center gap-2">
          <button
            onClick={onNotificationsClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

          <button
            onClick={onMessagesClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
