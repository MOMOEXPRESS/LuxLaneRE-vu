"use client"

import { LuxlaneLogo } from "@/components/ui/luxlane-logo"
import { Bell, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { BackButton } from "@/components/layout/back-button"

interface HeaderProps {
  title?: string
  showLogo?: boolean
  showSearch?: boolean
  showNotifications?: boolean
  showAvatar?: boolean
  showBack?: boolean
  onAvatarClick?: () => void
  onSearchClick?: () => void
  onSettingsClick?: () => void
  notificationCount?: number
}

export function Header({
  title,
  showLogo = true,
  showSearch = true,
  showNotifications = true,
  showAvatar = true,
  showBack = false,
  onAvatarClick,
  onSearchClick,
  onSettingsClick,
  notificationCount = 0,
}: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && <BackButton />}
          {showLogo && !showBack ? (
            <LuxlaneLogo size="sm" />
          ) : title ? (
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          ) : null}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button variant="ghost" size="icon" onClick={onSearchClick}>
              <Search className="w-5 h-5" />
            </Button>
          )}
          {showNotifications && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          )}
          {onSettingsClick && (
            <Button variant="ghost" size="icon" onClick={onSettingsClick}>
              <Settings className="w-5 h-5" />
            </Button>
          )}
          {showAvatar && user && (
            <Button variant="ghost" size="icon" className="ml-1" onClick={onAvatarClick}>
              <Avatar className="w-7 h-7">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
