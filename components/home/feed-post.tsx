"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Send, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api-client"

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
    likedByMe?: boolean
    savedByMe?: boolean
    createdAt: Date
  }
  onUserClick?: () => void
  onLike?: () => void
  onSave?: () => void
  refreshFeed?: () => void
}

interface CommentItem {
  id: string
  user: { name: string; username: string; avatar: string }
  body: string
  createdAt: string
}

export function FeedPost({ post, onUserClick, onLike, onSave, refreshFeed }: FeedPostProps) {
  const { user: currentUser } = useAuth()
  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [saved, setSaved] = useState(post.savedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showCommentsSheet, setShowCommentsSheet] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const isOwnPost = currentUser?.username === post.user.username

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return
    const res = await api.deletePost(post.id)
    if (!res.error) {
      setDeleted(true)
      refreshFeed?.()
    }
  }

  if (deleted) return null
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [commentSending, setCommentSending] = useState(false)

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    const res = await api.getComments(post.id)
    if (!res.error && Array.isArray(res.data)) {
      setComments(res.data as CommentItem[])
    }
    setCommentsLoading(false)
  }, [post.id])

  useEffect(() => {
    setLiked(post.likedByMe ?? false)
    setSaved(post.savedByMe ?? false)
    setLikeCount(post.likes)
  }, [post.id, post.likedByMe, post.savedByMe, post.likes])

  useEffect(() => {
    if (showCommentsSheet) loadComments()
  }, [showCommentsSheet, loadComments])

  const handleLike = () => {
    if (onLike) {
      onLike()
      setLiked(!liked)
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    } else {
      setLiked(!liked)
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    }
  }

  const handleSave = () => {
    if (onSave) onSave()
    setSaved(!saved)
  }

  const handleSendComment = async () => {
    const body = commentInput.trim()
    if (!body || commentSending) return
    setCommentSending(true)
    const res = await api.addComment(post.id, body)
    setCommentSending(false)
    if (res.error) return
    setCommentInput("")
    loadComments()
    refreshFeed?.()
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
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
              {isOwnPost && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted"
                  onClick={() => { setShowMenu(false); handleDelete() }}
                >
                  <Trash2 className="w-4 h-4" /> Delete post
                </button>
              )}
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setShowMenu(false)}
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          )}
        </div>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowCommentsSheet(true)}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSave}>
            <Bookmark className={`w-6 h-6 ${saved ? "fill-foreground" : ""}`} />
          </Button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">{likeCount.toLocaleString()} likes</p>

        {/* Caption */}
        <p className="text-sm">
          <button
            type="button"
            className="font-semibold mr-1 hover:underline focus:outline-none"
            onClick={onUserClick}
          >
            {post.user.username}
          </button>
          {post.caption}
        </p>

        {/* Comments */}
        <button
          type="button"
          className="text-sm text-muted-foreground mt-1 hover:underline"
          onClick={() => setShowCommentsSheet(true)}
        >
          {post.comments > 0 ? `View all ${post.comments} comments` : "Add a comment…"}
        </button>

        {/* Timestamp */}
        <p className="text-[11px] text-muted-foreground mt-1 uppercase">
          {formatDistanceToNow(post.createdAt, { addSuffix: true })}
        </p>
      </div>

      {/* Comments Sheet */}
      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={c.user.avatar || "/placeholder.svg"} alt={c.user.name} />
                    <AvatarFallback>{c.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{c.user.username}</span>{" "}
                      <span className="text-muted-foreground">{c.body}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-3 border-t border-border">
            <Input
              placeholder="Add a comment…"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSendComment} disabled={!commentInput.trim() || commentSending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </article>
  )
}
