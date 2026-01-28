"use client"

import { useState } from "react"
import { Search, X, BadgeCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { mockPosts, mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ExploreViewProps {
  onProfileClick: (userId: string) => void
  onPostClick: (postId: string) => void
}

const categories = ["All", "Models", "Brands", "Agencies", "Photographers", "Trending"]

export function ExploreView({ onProfileClick, onPostClick }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search models, brands, agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="h-12 pl-12 pr-10 bg-secondary/50 border-0 rounded-xl text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        {!isSearchFocused && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px]",
                  activeCategory === category
                    ? "bg-gold text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className={cn("pt-28", !isSearchFocused && "pt-36")}>
        {/* Search Results */}
        {isSearchFocused && searchQuery && (
          <div className="px-4 space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onProfileClick(user.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full p-[2px]",
                    user.verified ? "bg-gradient-to-br from-gold to-gold-muted" : "bg-border",
                  )}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-background">
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{user.username}</span>
                    {user.verified && <BadgeCheck className="h-4 w-4 text-gold fill-gold/20" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{user.name}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-secondary/50 rounded-full">
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {!isSearchFocused && (
          <div className="grid grid-cols-3 gap-[2px] px-[2px]">
            {mockPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostClick(post.id)}
                className="relative aspect-square overflow-hidden"
              >
                <img
                  src={post.media[0] || "/placeholder.svg"}
                  alt=""
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
                {post.media.length > 1 && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 text-foreground drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm16-8V6H8v14h14v-2h-2V8h2z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
