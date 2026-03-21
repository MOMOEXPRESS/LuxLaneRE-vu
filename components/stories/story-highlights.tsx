"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus } from "lucide-react"

interface HighlightItem {
  id: string
  title: string
  coverUrl: string | null
  storyCount: number
}

interface StoryHighlightsProps {
  userId: string
  isOwn: boolean
  onViewHighlight?: (highlight: HighlightItem) => void
  onCreateHighlight?: () => void
}

export function StoryHighlights({ userId, isOwn, onViewHighlight, onCreateHighlight }: StoryHighlightsProps) {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])

  const fetchHighlights = useCallback(async () => {
    const res = await fetch(`/api/highlights?userId=${userId}`, { credentials: "include" })
    if (res.ok) {
      const data = await res.json()
      if (data.highlights) setHighlights(data.highlights)
    }
  }, [userId])

  useEffect(() => {
    fetchHighlights()
  }, [fetchHighlights])

  if (highlights.length === 0 && !isOwn) return null

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
      {isOwn && (
        <button
          type="button"
          className="flex flex-col items-center gap-1 shrink-0"
          onClick={onCreateHighlight}
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 border border-dashed border-muted-foreground/30 flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">New</span>
        </button>
      )}
      {highlights.map((h) => (
        <button
          key={h.id}
          type="button"
          className="flex flex-col items-center gap-1 shrink-0"
          onClick={() => onViewHighlight?.(h)}
        >
          <div className="w-16 h-16 rounded-full border border-muted-foreground/30 overflow-hidden bg-muted">
            {h.coverUrl ? (
              <img src={h.coverUrl} alt={h.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                {h.title[0]}
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground truncate max-w-[64px]">{h.title}</span>
        </button>
      ))}
    </div>
  )
}
