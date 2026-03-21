"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Eye, Pause, Play } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api-client"

interface StoryItem {
  id: string
  mediaUrl: string
  mediaType: string
  caption: string | null
  viewCount: number
  viewed: boolean
  createdAt: string
  expiresAt: string
}

interface StoryViewerProps {
  user: {
    userId: string
    username: string
    name: string
    avatar: string | null
    isOwn: boolean
    stories: StoryItem[]
  }
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
}

const STORY_DURATION = 5000 // 5 seconds per story

export function StoryViewer({ user, onClose, onNext, onPrev }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const progressRef = useRef<number>(0)

  const story = user.stories[currentIndex]

  const markViewed = useCallback(async (storyId: string) => {
    await api.viewStory(storyId)
  }, [])

  useEffect(() => {
    if (story && !user.isOwn) {
      markViewed(story.id)
    }
  }, [story, user.isOwn, markViewed])

  const goNext = useCallback(() => {
    if (currentIndex < user.stories.length - 1) {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
      progressRef.current = 0
    } else {
      onNext ? onNext() : onClose()
    }
  }, [currentIndex, user.stories.length, onNext, onClose])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
      progressRef.current = 0
    } else {
      onPrev?.()
    }
  }, [currentIndex, onPrev])

  // Auto-advance timer
  useEffect(() => {
    if (paused) return

    startTimeRef.current = Date.now() - progressRef.current * STORY_DURATION

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min(elapsed / STORY_DURATION, 1)
      setProgress(pct)
      progressRef.current = pct

      if (pct >= 1) {
        clearInterval(interval)
        goNext()
      }
    }, 30)

    timerRef.current = interval
    return () => clearInterval(interval)
  }, [currentIndex, paused, goNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "Escape") onClose()
      else if (e.key === " ") {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [goNext, goPrev, onClose])

  if (!story) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {user.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{
                width: `${i < currentIndex ? 100 : i === currentIndex ? progress * 100 : 0}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border border-white/30">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white text-sm font-medium">{user.username}</p>
            <p className="text-white/60 text-[10px]">
              {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user.isOwn && (
            <span className="flex items-center gap-1 text-white/70 text-xs mr-2">
              <Eye className="w-3 h-3" />
              {story.viewCount}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-8 w-8"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-8 w-8"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div className="relative w-full h-full max-w-lg mx-auto">
        {story.mediaType === "video" ? (
          <video
            src={story.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={story.mediaUrl}
            alt={story.caption || "Story"}
            className="w-full h-full object-contain"
          />
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-8 left-0 right-0 text-center px-8">
            <p className="text-white text-sm bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              {story.caption}
            </p>
          </div>
        )}
      </div>

      {/* Tap zones for navigation */}
      <button
        type="button"
        className="absolute left-0 top-16 bottom-16 w-1/3 z-10"
        onClick={goPrev}
        aria-label="Previous story"
      />
      <button
        type="button"
        className="absolute right-0 top-16 bottom-16 w-1/3 z-10"
        onClick={goNext}
        aria-label="Next story"
      />

      {/* Edge nav buttons (visible on hover) */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 hidden sm:flex"
          onClick={goPrev}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}
      {currentIndex < user.stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 hidden sm:flex"
          onClick={goNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
