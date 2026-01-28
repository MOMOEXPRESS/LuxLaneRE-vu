"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface FeedPostProps {
  post: {
    id: string
    user: {
      name: string
      username: string
      avatar: string
      verified: boolean
    }
    image: string
    caption: string
    likes: number
    comments: number
    createdAt: Date
  }
  onUserClick?: () => void
}

export function FeedPost({ post, onUserClick }: FeedPostProps) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  return (
    <article className="border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex items-center gap-2" onClick={onUserClick}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm">{post.user.username}</span>
            {post.user.verified && <BadgeCheck className="w-4 h-4 text-foreground" />}
          </div>
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      <div className="aspect-[4/5] bg-muted">
        <img src={post.image || "/placeholder.svg"} alt={post.caption} className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLike}>
              <Heart className={`w-6 h-6 ${liked ? "fill-destructive text-destructive" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSaved(!saved)}>
            <Bookmark className={`w-6 h-6 ${saved ? "fill-foreground" : ""}`} />
          </Button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">{likeCount.toLocaleString()} likes</p>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold mr-1">{post.user.username}</span>
          {post.caption}
        </p>

        {/* Comments */}
        {post.comments > 0 && (
          <button className="text-sm text-muted-foreground mt-1">View all {post.comments} comments</button>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-muted-foreground mt-1 uppercase">
          {formatDistanceToNow(post.createdAt, { addSuffix: true })}
        </p>
      </div>
    </article>
  )
}
