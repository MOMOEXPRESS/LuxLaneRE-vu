"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { api } from "@/lib/api-client"

interface StoryUser {
  userId: string
  username: string
  name: string
  avatar: string | null
  isOwn: boolean
  hasUnviewed: boolean
  stories: {
    id: string
    mediaUrl: string
    mediaType: string
    caption: string | null
    viewCount: number
    viewed: boolean
    createdAt: string
    expiresAt: string
  }[]
}

interface StoryBarProps {
  onViewStories: (user: StoryUser) => void
  onCreateStory: () => void
}

export function StoryBar({ onViewStories, onCreateStory }: StoryBarProps) {
  const [feed, setFeed] = useState<StoryUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStories = useCallback(async () => {
    const res = await api.getStoryFeed()
    const data = res.data as { feed?: StoryUser[] } | undefined
    if (data?.feed) {
      setFeed(data.feed)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  if (loading) {
    return (
      <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-10 h-2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  const hasOwnStory = feed.some((u) => u.isOwn)

  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
      {/* Add story button (shown if user has no active story) */}
      {!hasOwnStory && (
        <button
          type="button"
          className="flex flex-col items-center gap-1 shrink-0"
          onClick={onCreateStory}
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">Your story</span>
        </button>
      )}

      {/* Story avatars */}
      {feed.map((user) => (
        <button
          key={user.userId}
          type="button"
          className="flex flex-col items-center gap-1 shrink-0"
          onClick={() => onViewStories(user)}
        >
          <div
            className={`w-16 h-16 rounded-full p-[2px] ${
              user.hasUnviewed
                ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500"
                : "bg-muted-foreground/30"
            }`}
          >
            <div className="w-full h-full rounded-full bg-background p-[2px]">
              <Avatar className="w-full h-full">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground truncate max-w-[64px]">
            {user.isOwn ? "Your story" : user.username}
          </span>
        </button>
      ))}
    </div>
  )
}
