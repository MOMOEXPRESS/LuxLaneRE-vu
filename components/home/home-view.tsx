"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ActiveCastings } from "./active-castings"
import { FeedToggle } from "./feed-toggle"
import { FeedPost } from "./feed-post"
import { MyRankCard } from "@/components/scoreboard/my-rank-card"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import { usePosts } from "@/lib/hooks/use-posts"
import { api } from "@/lib/api-client"
import { getRecommendedCastingsForModel } from "@/lib/ai-matching"
import { Card } from "@/components/ui/card"
import { ChevronRight, Sparkles } from "lucide-react"
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

  // Get recommended castings for model
  const recommendedCastings = isModel && user ? getRecommendedCastingsForModel(user, castings, 3) : []

  return (
    <div className="pb-20">
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
          <div className="space-y-2">
            {recommendedCastings.map(({ casting, fitScore }) => (
              <Card
                key={casting.id}
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onViewCasting(casting)}
              >
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {casting.images?.[0] && (
                    <img
                      src={casting.images[0] || "/placeholder.svg"}
                      alt={casting.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{casting.title}</p>
                  <p className="text-xs text-muted-foreground">{casting.creator.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-lg font-bold ${
                      fitScore.total >= 80
                        ? "text-emerald-500"
                        : fitScore.total >= 60
                          ? "text-sky-500"
                          : "text-amber-500"
                    }`}
                  >
                    {fitScore.total}%
                  </div>
                  <p className="text-[10px] text-muted-foreground">Match</p>
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
          feedPosts.map((post) => (
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
