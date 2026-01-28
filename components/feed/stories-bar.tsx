"use client"

import { Plus } from "lucide-react"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StoriesBarProps {
  currentUser: User
  users: User[]
  onStoryClick: (userId: string) => void
  onAddStory: () => void
}

export function StoriesBar({ currentUser, users, onStoryClick, onAddStory }: StoriesBarProps) {
  return (
    <div className="py-4 border-b border-border/30">
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
        {/* Add Story */}
        <button onClick={onAddStory} className="flex flex-col items-center gap-2 min-w-[72px]">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
              <img
                src={currentUser.avatar || "/placeholder.svg"}
                alt="Your story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-gold rounded-full flex items-center justify-center border-2 border-background">
              <Plus className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Your story</span>
        </button>

        {/* Other Stories */}
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onStoryClick(user.id)}
            className="flex flex-col items-center gap-2 min-w-[72px]"
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full p-[2px]",
                user.verified ? "bg-gradient-to-br from-gold to-gold-muted" : "bg-border",
              )}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-background">
                <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xs text-foreground truncate max-w-[72px]">{user.username}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
