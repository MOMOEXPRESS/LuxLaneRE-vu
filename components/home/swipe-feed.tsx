"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  UserPlus,
  BadgeCheck,
  Send,
  ChevronUp,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api-client"

interface SwipePost {
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

interface SwipeFeedProps {
  posts: SwipePost[]
  isLoading: boolean
  onUserClick: (username: string) => void
  onLike: (postId: string, currentlyLiked: boolean) => void
  onSave: (postId: string, currentlySaved: boolean) => void
  refreshFeed: () => void
}

interface CommentItem {
  id: string
  user: { name: string; username: string; avatar: string }
  body: string
  createdAt: string
}

export function SwipeFeed({ posts, isLoading, onUserClick, onLike, onSave, refreshFeed }: SwipeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)

  const goToPost = useCallback((index: number) => {
    if (index >= 0 && index < posts.length) {
      setCurrentIndex(index)
    }
  }, [posts.length])

  // Touch handling for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY
    const deltaTime = Date.now() - touchStartTime.current
    const velocity = Math.abs(deltaY) / deltaTime

    // Swipe threshold: 50px or fast flick
    if (deltaY > 50 || (deltaY > 20 && velocity > 0.3)) {
      goToPost(currentIndex + 1) // swipe up → next
    } else if (deltaY < -50 || (deltaY < -20 && velocity > 0.3)) {
      goToPost(currentIndex - 1) // swipe down → previous
    }
  }, [currentIndex, goToPost])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goToPost(currentIndex + 1)
      if (e.key === "ArrowUp" || e.key === "k") goToPost(currentIndex - 1)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentIndex, goToPost])

  // Mouse wheel
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let wheelTimeout: NodeJS.Timeout
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      clearTimeout(wheelTimeout)
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 30) goToPost(currentIndex + 1)
        else if (e.deltaY < -30) goToPost(currentIndex - 1)
      }, 50)
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [currentIndex, goToPost])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground gap-3 px-8">
        <ChevronUp className="w-8 h-8 opacity-30" />
        <p className="text-center">No posts yet. Follow people or explore to see content here.</p>
      </div>
    )
  }

  const post = posts[currentIndex]
  if (!post) return null

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-10rem)] overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <PostCard
        key={post.id}
        post={post}
        onUserClick={() => onUserClick(post.user.username)}
        onLike={() => onLike(post.id, post.likedByMe ?? false)}
        onSave={() => onSave(post.id, post.savedByMe ?? false)}
        refreshFeed={refreshFeed}
        isFirst={currentIndex === 0}
        isLast={currentIndex === posts.length - 1}
        index={currentIndex}
        total={posts.length}
      />

      {/* Swipe hint */}
      {currentIndex === 0 && posts.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center animate-bounce">
          <p className="text-white/40 text-xs flex items-center gap-1">
            <ChevronUp className="w-3 h-3 rotate-180" />
            Swipe up for more
          </p>
        </div>
      )}
    </div>
  )
}

function PostCard({
  post,
  onUserClick,
  onLike,
  onSave,
  refreshFeed,
  index,
  total,
}: {
  post: SwipePost
  onUserClick: () => void
  onLike: () => void
  onSave: () => void
  refreshFeed: () => void
  isFirst: boolean
  isLast: boolean
  index: number
  total: number
}) {
  const { user: currentUser } = useAuth()
  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [saved, setSaved] = useState(post.savedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [commentSending, setCommentSending] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const isOwnPost = currentUser?.username === post.user.username

  useEffect(() => {
    setLiked(post.likedByMe ?? false)
    setSaved(post.savedByMe ?? false)
    setLikeCount(post.likes)
  }, [post.id, post.likedByMe, post.savedByMe, post.likes])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    const res = await api.getComments(post.id)
    if (!res.error && Array.isArray(res.data)) {
      setComments(res.data as CommentItem[])
    }
    setCommentsLoading(false)
  }, [post.id])

  useEffect(() => {
    if (showComments) loadComments()
  }, [showComments, loadComments])

  const handleLike = () => {
    onLike()
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const handleSave = () => {
    onSave()
    setSaved(!saved)
  }

  const handleFollow = async () => {
    setIsFollowing(true)
    // Would need userId lookup — for now just toggle visually
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
    refreshFeed()
  }

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return
    await api.deletePost(post.id)
    refreshFeed()
  }

  return (
    <div className="relative w-full h-full">
      {/* Full-screen image */}
      <img
        src={post.image || "/placeholder.svg"}
        alt={post.caption}
        className="w-full h-full object-cover"
      />

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

      {/* Top bar — post counter */}
      <div className="absolute top-3 left-0 right-0 flex justify-center">
        <span className="text-white/50 text-xs font-medium">
          {index + 1} / {total}
        </span>
      </div>

      {/* Right side — action buttons (TikTok style) */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
        {/* Profile pic */}
        <button onClick={onUserClick} className="relative">
          <Avatar className="w-11 h-11 ring-2 ring-white">
            <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
            <AvatarFallback className="text-xs">{post.user.name[0]}</AvatarFallback>
          </Avatar>
          {/* Follow button overlay */}
          {!isOwnPost && !isFollowing && (
            <button
              onClick={(e) => { e.stopPropagation(); handleFollow() }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center"
            >
              <UserPlus className="w-3 h-3 text-white" />
            </button>
          )}
        </button>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <Heart className={`w-7 h-7 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
          <span className="text-white text-[10px] font-medium">{likeCount > 0 ? likeCount : ""}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5">
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-[10px] font-medium">{post.comments > 0 ? post.comments : ""}</span>
        </button>

        {/* Bookmark / Save */}
        <button onClick={handleSave} className="flex flex-col items-center gap-0.5">
          <Bookmark className={`w-7 h-7 ${saved ? "fill-white text-white" : "text-white"}`} />
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-0.5">
          <Share2 className="w-6 h-6 text-white" />
        </button>

        {/* Delete (own post) */}
        {isOwnPost && (
          <button onClick={handleDelete} className="flex flex-col items-center gap-0.5">
            <Trash2 className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>

      {/* Bottom — username + caption */}
      <div className="absolute bottom-6 left-4 right-20">
        <button onClick={onUserClick} className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold text-sm">@{post.user.username}</span>
          {post.user.verified && <BadgeCheck className="w-4 h-4 text-white" />}
        </button>
        {post.caption && (
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3">{post.caption}</p>
        )}
        <p className="text-white/40 text-[10px] mt-1 uppercase">
          {formatDistanceToNow(post.createdAt, { addSuffix: true })}
        </p>
      </div>

      {/* Comments Sheet */}
      <Sheet open={showComments} onOpenChange={setShowComments}>
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
    </div>
  )
}
