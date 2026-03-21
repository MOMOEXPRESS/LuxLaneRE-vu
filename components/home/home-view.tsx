"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ActiveCastings } from "./active-castings"
import { FeedToggle } from "./feed-toggle"
import { FeedPost } from "./feed-post"
import { StoryBar } from "@/components/stories/story-bar"
import { StoryViewer } from "@/components/stories/story-viewer"
import { MyRankCard } from "@/components/scoreboard/my-rank-card"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import { usePosts } from "@/lib/hooks/use-posts"
import { api } from "@/lib/api-client"
import { getRecommendedCastingsForModel } from "@/lib/ai-matching"
import { Card } from "@/components/ui/card"
import { CreateStorySheet } from "@/components/stories/create-story-sheet"
import { ChevronRight, Sparkles, MapPin, DollarSign, Calendar, Clock } from "lucide-react"
import type { Casting, User } from "@/lib/types"

interface HomeViewProps {
  onViewCasting: (casting: Casting) => void
  onViewProfile: (user: User) => void
  onViewCastingsHub: () => void
  onViewScoreboard: () => void
}

export function HomeView({ onViewCasting, onViewProfile, onViewCastingsHub, onViewScoreboard }: HomeViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { castings } = useStore()
  const { posts: apiPosts, isLoading: postsLoading, refresh: refreshPosts } = usePosts()
  const [feedType, setFeedType] = useState<"foryou" | "following">("foryou")

  const feedPosts = apiPosts.map((p: { id: string; user: { name: string; username: string; avatar: string; verified: boolean }; imageUrl: string; caption: string | null; likes: number; comments: number; likedByMe: boolean; savedByMe: boolean; createdAt: string }) => ({
    id: p.id,
    user: p.user,
    image: p.imageUrl,
    caption: p.caption ?? "",
    likes: p.likes,
    comments: p.comments,
    likedByMe: p.likedByMe,
    savedByMe: p.savedByMe,
    createdAt: new Date(p.createdAt),
  }))

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    const res = currentlyLiked ? await api.unlikePost(postId) : await api.likePost(postId)
    if (!res.error) refreshPosts()
  }

  const handleSave = async (postId: string, currentlySaved: boolean) => {
    const res = currentlySaved ? await api.unsavePost(postId) : await api.savePost(postId)
    if (!res.error) refreshPosts()
  }

  const handleUserClick = (username: string) => {
    router.push("/u/" + username)
  }

  const isModel = user?.role === "model"

  // Story creation state
  const [showCreateStory, setShowCreateStory] = useState(false)

  // Story viewer state
  const [viewingStories, setViewingStories] = useState<{
    userId: string
    username: string
    name: string
    avatar: string | null
    isOwn: boolean
    stories: { id: string; mediaUrl: string; mediaType: string; caption: string | null; viewCount: number; viewed: boolean; createdAt: string; expiresAt: string }[]
  } | null>(null)

  // Get recommended castings for model
  const recommendedCastings = isModel && user ? getRecommendedCastingsForModel(user, castings, 3) : []

  return (
    <div className="pb-20">
      {/* Stories Bar */}
      <StoryBar
        onViewStories={(u) => setViewingStories(u)}
        onCreateStory={() => setShowCreateStory(true)}
      />

      {/* Create Story Sheet */}
      <CreateStorySheet
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onCreated={() => {
          // Stories will refresh on next feed load
        }}
      />

      {/* Story Viewer */}
      {viewingStories && (
        <StoryViewer
          user={viewingStories}
          onClose={() => setViewingStories(null)}
        />
      )}

      {/* My Rank Card - Model only */}
      {isModel && user?.metrics && (
        <div className="px-4 pt-4">
          <MyRankCard user={user} onViewScoreboard={onViewScoreboard} />
        </div>
      )}

      {/* Active Castings Module */}
      <ActiveCastings onViewCasting={onViewCasting} onViewAll={onViewCastingsHub} />

      {/* Recommended for You - Model only */}
      {isModel && recommendedCastings.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="font-semibold text-sm">Recommended for You</h3>
            </div>
            <button className="text-xs text-muted-foreground flex items-center" onClick={onViewCastingsHub}>
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recommendedCastings.map(({ casting, fitScore }) => (
              <Card
                key={casting.id}
                className="overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors !p-0 !gap-0"
                onClick={() => onViewCasting(casting)}
              >
                <div className="flex h-28">
                  {/* Left: Image + title overlay */}
                  <div className="relative w-28 shrink-0 bg-muted">
                    <img
                      src={casting.images?.[0] || "/placeholder.svg"}
                      alt={casting.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                      <p className="font-semibold text-[11px] text-white line-clamp-2 leading-tight">{casting.title}</p>
                      <p className="text-[9px] text-zinc-300 mt-0.5 truncate">{casting.creator.name}</p>
                    </div>
                    {/* Match badge */}
                    <div
                      className={`absolute top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        fitScore.total >= 80
                          ? "bg-emerald-500/90 text-black"
                          : fitScore.total >= 60
                            ? "bg-sky-500/90 text-black"
                            : "bg-amber-500/90 text-black"
                      }`}
                    >
                      {fitScore.total}%
                    </div>
                  </div>
                  {/* Right: Casting details */}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{casting.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3 shrink-0" />
                        <span>{casting.pay ? `€${casting.pay.amount}/${casting.pay.type}` : "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>
                          {casting.dates?.start
                            ? new Date(casting.dates.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "Flexible"}
                          {casting.dates?.end && ` – ${new Date(casting.dates.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {casting.deadline
                          ? `Deadline: ${new Date(casting.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : "Open deadline"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Feed Toggle */}
      <FeedToggle active={feedType} onChange={setFeedType} />

      {/* Feed Posts */}
      <div>
        {postsLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading feed…</div>
        ) : feedPosts.length > 0 ? (
          feedPosts.map((post: any) => (
            <FeedPost
              key={post.id}
              post={post}
              onUserClick={() => handleUserClick(post.user.username)}
              onLike={() => handleLike(post.id, post.likedByMe)}
              onSave={() => handleSave(post.id, post.savedByMe)}
              refreshFeed={refreshPosts}
            />
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">No posts yet.</div>
        )}
      </div>
    </div>
  )
}
