"use client"

import { useState } from "react"
import { ActiveCastings } from "./active-castings"
import { FeedToggle } from "./feed-toggle"
import { FeedPost } from "./feed-post"
import { MyRankCard } from "@/components/scoreboard/my-rank-card"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import { getRecommendedCastingsForModel } from "@/lib/ai-matching"
import { Card } from "@/components/ui/card"
import { ChevronRight, Sparkles } from "lucide-react"
import type { Casting, User } from "@/lib/types"

// Mock feed posts
const mockPosts = [
  {
    id: "p1",
    user: {
      name: "Sofia Laurent",
      username: "sofialaurent",
      avatar: "/professional-model-headshot-woman-brunette.jpg",
      verified: true,
    },
    image: "/high-fashion-editorial-model.jpg",
    caption: "Behind the scenes from yesterday's Dior shoot. Thank you to the incredible team.",
    likes: 12453,
    comments: 234,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: "p2",
    user: {
      name: "Maison Dior",
      username: "dior",
      avatar: "/dior-luxury-fashion-brand-logo-minimal.jpg",
      verified: true,
    },
    image: "/dior-fashion-campaign-spring-aesthetic.jpg",
    caption: "Spring 2025. A new chapter begins. #DiorSS25",
    likes: 89234,
    comments: 1245,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "p3",
    user: {
      name: "Isabella Rossi",
      username: "isabellarossi",
      avatar: "/professional-model-headshot-woman-italian-dark-hai.jpg",
      verified: true,
    },
    image: "/runway-fashion-week-model.jpg",
    caption: "Milan Fashion Week finale walk. Dreams do come true.",
    likes: 8921,
    comments: 156,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
]

interface HomeViewProps {
  onViewCasting: (casting: Casting) => void
  onViewProfile: (user: User) => void
  onViewCastingsHub: () => void
  onViewScoreboard: () => void
}

export function HomeView({ onViewCasting, onViewProfile, onViewCastingsHub, onViewScoreboard }: HomeViewProps) {
  const { user } = useAuth()
  const { castings } = useStore()
  const [feedType, setFeedType] = useState<"foryou" | "following">("foryou")

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
        {mockPosts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
