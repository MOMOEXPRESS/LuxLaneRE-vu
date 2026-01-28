"use client"

import { ArrowLeft, Settings, MoreHorizontal, BadgeCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

interface ProfileHeaderProps {
  user: User
  isOwnProfile: boolean
  isFollowing: boolean
  onBack: () => void
  onSettings: () => void
  onFollow: () => void
  onMessage: () => void
  onBook?: () => void
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
  onBack,
  onSettings,
  onFollow,
  onMessage,
  onBook,
}: ProfileHeaderProps) {
  const getTierBadge = () => {
    if (user.tier === "black")
      return <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-bold rounded">BLACK</span>
    if (user.tier === "elite")
      return <span className="px-2 py-0.5 bg-gold text-primary-foreground text-[10px] font-bold rounded">ELITE</span>
    return null
  }

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-charcoal to-charcoal-light" />

      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {isOwnProfile ? (
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center"
          >
            <Settings className="h-5 w-5" />
          </button>
        ) : (
          <button className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-12">
        {/* Avatar */}
        <div
          className={cn(
            "w-24 h-24 rounded-full p-[3px] bg-background",
            user.verified ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : "",
          )}
        >
          <img
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {/* Name & Badge */}
        <div className="mt-3 flex items-center gap-2">
          <h1 className="font-serif text-xl font-medium">{user.name}</h1>
          {user.verified && <BadgeCheck className="h-5 w-5 text-gold fill-gold/20" />}
          {getTierBadge()}
        </div>

        {/* Username & Role */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground">@{user.username}</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full capitalize">
            {user.role}
          </span>
        </div>

        {/* Bio */}
        <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>

        {/* Website */}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-gold hover:underline"
          >
            {user.website.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <button className="text-center">
            <div className="font-semibold">{formatNumber(user.followers)}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </button>
          <button className="text-center">
            <div className="font-semibold">{formatNumber(user.following)}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </button>
          {user.role === "agency" && user.roster && (
            <div className="text-center">
              <div className="font-semibold">{user.roster.length}</div>
              <div className="text-xs text-muted-foreground">Talent</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pb-4">
          {isOwnProfile ? (
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-full border-border/50 bg-transparent hover:bg-secondary"
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                onClick={onFollow}
                className={cn(
                  "flex-1 h-11 rounded-full",
                  isFollowing
                    ? "bg-transparent border border-border/50 text-foreground hover:bg-secondary"
                    : "bg-gold text-primary-foreground hover:bg-gold/90",
                )}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button
                onClick={onMessage}
                variant="outline"
                className="flex-1 h-11 rounded-full border-border/50 bg-transparent hover:bg-secondary"
              >
                Message
              </Button>
              {(user.role === "model" || user.role === "agency") && onBook && (
                <Button
                  onClick={onBook}
                  className="h-11 px-6 rounded-full bg-gold text-primary-foreground hover:bg-gold/90"
                >
                  Book
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
