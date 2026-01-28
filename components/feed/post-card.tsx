"use client"

import { useState } from "react"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck } from "lucide-react"
import type { Post } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "@/lib/format"

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onBookmark: (postId: string) => void
  onProfileClick: (userId: string) => void
}

export function PostCard({ post, onLike, onComment, onShare, onBookmark, onProfileClick }: PostCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(post.liked)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked)
  const [likeCount, setLikeCount] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
    onLike(post.id)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark(post.id)
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <article className="border-b border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onProfileClick(post.user.id)} className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full p-[2px]",
              post.user.verified ? "bg-gradient-to-br from-gold to-gold-muted" : "bg-border",
            )}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-background">
              <img
                src={post.user.avatar || "/placeholder.svg"}
                alt={post.user.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{post.user.username}</span>
              {post.user.verified && <BadgeCheck className="h-4 w-4 text-gold fill-gold/20" />}
            </div>
            <span className="text-xs text-muted-foreground">{post.user.location}</span>
          </div>
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Media */}
      <div className="relative aspect-[4/5] bg-secondary">
        <img
          src={post.media[currentMediaIndex] || "/placeholder.svg"}
          alt={post.caption}
          className="w-full h-full object-cover"
        />

        {/* Carousel Indicators */}
        {post.media.length > 1 && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {post.media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentMediaIndex ? "bg-foreground w-3" : "bg-foreground/50",
                  )}
                />
              ))}
            </div>
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-background/60 text-xs">
              {currentMediaIndex + 1}/{post.media.length}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 min-h-[44px] transition-transform active:scale-90"
            >
              <Heart className={cn("h-6 w-6 transition-colors", isLiked ? "fill-red-500 text-red-500" : "")} />
            </button>
            <button onClick={() => onComment(post.id)} className="flex items-center gap-2 min-h-[44px]">
              <MessageCircle className="h-6 w-6" />
            </button>
            <button onClick={() => onShare(post.id)} className="flex items-center gap-2 min-h-[44px]">
              <Send className="h-6 w-6" />
            </button>
          </div>

          <button onClick={handleBookmark} className="min-h-[44px] transition-transform active:scale-90">
            <Bookmark className={cn("h-6 w-6 transition-colors", isBookmarked ? "fill-gold text-gold" : "")} />
          </button>
        </div>

        {/* Likes */}
        <div className="mt-2">
          <span className="font-semibold text-sm">{formatCount(likeCount)} likes</span>
        </div>

        {/* Caption */}
        <div className="mt-1">
          <span className="text-sm">
            <button onClick={() => onProfileClick(post.user.id)} className="font-semibold mr-1">
              {post.user.username}
            </button>
            {post.caption}
          </span>
        </div>

        {/* Comments Link */}
        {post.comments > 0 && (
          <button onClick={() => onComment(post.id)} className="mt-1 text-sm text-muted-foreground">
            View all {formatCount(post.comments)} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-xs text-muted-foreground uppercase">{formatDistanceToNow(post.createdAt)}</p>
      </div>
    </article>
  )
}
