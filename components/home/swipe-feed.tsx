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
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api-client"
import { motion, AnimatePresence } from "framer-motion"

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
  const [direction, setDirection] = useState(0) // -1 left, 1 right
  const touchStartX = useRef(0)
  const touchStartTime = useRef(0)

  const goToPost = useCallback((index: number, dir: number) => {
    if (index >= 0 && index < posts.length) {
      setDirection(dir)
      setCurrentIndex(index)
    }
  }, [posts.length])

  // Touch handling for horizontal swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX
    const deltaTime = Date.now() - touchStartTime.current
    const velocity = Math.abs(deltaX) / deltaTime

    // Swipe threshold: 50px or fast flick
    if (deltaX > 50 || (deltaX > 20 && velocity > 0.3)) {
      goToPost(currentIndex + 1, 1) // swipe left → next
    } else if (deltaX < -50 || (deltaX < -20 && velocity > 0.3)) {
      goToPost(currentIndex - 1, -1) // swipe right → previous
    }
  }, [currentIndex, goToPost])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") goToPost(currentIndex + 1, 1)
      if (e.key === "ArrowLeft" || e.key === "h") goToPost(currentIndex - 1, -1)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentIndex, goToPost])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-muted-foreground gap-3 px-8">
        <p className="text-center">No posts yet. Follow people or explore to see content here.</p>
      </div>
    )
  }

  const post = posts[currentIndex]
  if (!post) return null

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  }

  return (
    <div
      className="relative overflow-hidden bg-black"
      style={{ height: "calc(100vh - 12rem)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={post.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0"
        >
          <PostCard
            post={post}
            onUserClick={() => onUserClick(post.user.username)}
            onLike={() => onLike(post.id, post.likedByMe ?? false)}
            onSave={() => onSave(post.id, post.savedByMe ?? false)}
            refreshFeed={refreshFeed}
            index={currentIndex}
            total={posts.length}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={() => goToPost(currentIndex - 1, -1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {currentIndex < posts.length - 1 && (
        <button
          onClick={() => goToPost(currentIndex + 1, 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dot indicators at bottom */}
      {posts.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={() => goToPost(i, i > currentIndex ? 1 : -1)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? "bg-white w-4" : "bg-white/40"
              }`}
            />
          ))}
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

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Right side — action buttons (TikTok style) */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        {/* Profile pic with follow button */}
        <div className="relative">
          <div onClick={onUserClick} className="cursor-pointer">
            <Avatar className="w-11 h-11 ring-2 ring-white">
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
              <AvatarFallback className="text-xs">{post.user.name?.[0]}</AvatarFallback>
            </Avatar>
          </div>
          {!isOwnPost && !isFollowing && (
            <div
              onClick={handleFollow}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer"
            >
              <UserPlus className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

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

        {/* Save + Like side by side at bottom */}
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
                    <AvatarFallback>{c.user.name?.[0]}</AvatarFallback>
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
