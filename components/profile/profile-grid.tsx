"use client"

import { Heart, MessageCircle } from "lucide-react"
import type { Post } from "@/lib/types"
import { formatNumber } from "@/lib/format"

interface ProfileGridProps {
  posts: Post[]
  onPostClick: (postId: string) => void
}

export function ProfileGrid({ posts, onPostClick }: ProfileGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="font-serif text-lg">No Posts Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Posts will appear here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick(post.id)}
          className="relative aspect-square overflow-hidden group"
        >
          <img
            src={post.media[0] || "/placeholder.svg"}
            alt=""
            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-foreground">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-semibold">{formatNumber(post.likes)}</span>
            </div>
            <div className="flex items-center gap-1 text-foreground">
              <MessageCircle className="h-5 w-5 fill-current" />
              <span className="font-semibold">{formatNumber(post.comments)}</span>
            </div>
          </div>
          {post.media.length > 1 && (
            <div className="absolute top-2 right-2">
              <svg className="w-4 h-4 text-foreground drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm16-8V6H8v14h14v-2h-2V8h2z" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
