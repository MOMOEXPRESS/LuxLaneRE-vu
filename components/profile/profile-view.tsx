"use client"

import { useState } from "react"
import { ProfileHeader } from "./profile-header"
import { ProfileTabs, type ProfileTab } from "./profile-tabs"
import { ProfileGrid } from "./profile-grid"
import { ModelCompCard } from "./model-comp-card"
import { AgencyRoster } from "./agency-roster"
import { AgencyCastings } from "./agency-castings"
import { mockPosts, mockUsers, getCurrentUser } from "@/lib/mock-data"
import { useStore } from "@/lib/store-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle } from "lucide-react"

interface ProfileViewProps {
  userId?: string
  onBack: () => void
  onSettings: () => void
  onMessage: (userId: string) => void
  onBook?: (userId: string) => void
  onProfileClick: (userId: string) => void
  onViewCasting?: (casting: import("@/lib/types").Casting) => void
}

export function ProfileView({ userId, onBack, onSettings, onMessage, onBook, onProfileClick, onViewCasting }: ProfileViewProps) {
  const currentUser = getCurrentUser()
  const { user: authUser } = useAuth()
  const { getCastingsForCreator } = useStore()
  const profileUser = userId ? mockUsers.find((u) => u.id === userId) || currentUser : currentUser
  const isOwnProfile = profileUser.id === currentUser.id

  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts")
  const [hasApplied, setHasApplied] = useState(false)

  const userPosts = mockPosts.filter((p) => p.userId === profileUser.id)
  const savedPosts = mockPosts.filter((p) => p.bookmarked)

  // Get roster models for agencies
  const rosterModels =
    profileUser.role === "agency" && profileUser.roster
      ? mockUsers.filter((u) => profileUser.roster?.includes(u.id))
      : []

  // Get agency castings from store
  const agencyCastings = profileUser.role === "agency" ? getCastingsForCreator(profileUser.id) : []

  // Show apply button if current user is a model viewing an agency profile
  const canApplyToAgency =
    !isOwnProfile &&
    profileUser.role === "agency" &&
    (authUser?.role === "model" || currentUser.role === "model")

  return (
    <div className="min-h-screen pb-20">
      <ProfileHeader
        user={profileUser}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onBack={onBack}
        onSettings={onSettings}
        onFollow={() => setIsFollowing(!isFollowing)}
        onMessage={() => onMessage(profileUser.id)}
        onBook={onBook ? () => onBook(profileUser.id) : undefined}
      />

      {/* Model Comp Card */}
      {profileUser.role === "model" && profileUser.measurements && (
        <ModelCompCard measurements={profileUser.measurements} portfolio={profileUser.portfolio} />
      )}

      {/* Apply to Agency Button */}
      {canApplyToAgency && (
        <div className="px-4 py-3 border-b border-border/30">
          {hasApplied ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Application Sent</span>
            </div>
          ) : (
            <Button
              onClick={() => setHasApplied(true)}
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-base"
            >
              <Send className="w-4 h-4 mr-2" />
              Apply to {profileUser.name}
            </Button>
          )}
        </div>
      )}

      {/* Agency Roster */}
      {profileUser.role === "agency" && rosterModels.length > 0 && (
        <AgencyRoster roster={rosterModels} onModelClick={onProfileClick} />
      )}

      {/* Agency Castings */}
      {profileUser.role === "agency" && agencyCastings.length > 0 && (
        <AgencyCastings castings={agencyCastings} onViewCasting={onViewCasting} />
      )}

      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwnProfile={isOwnProfile}
        userRole={profileUser.role}
      />

      {activeTab === "posts" && <ProfileGrid posts={userPosts} onPostClick={() => {}} />}

      {activeTab === "saved" && isOwnProfile && <ProfileGrid posts={savedPosts} onPostClick={() => {}} />}

      {activeTab === "portfolio" && profileUser.role === "model" && profileUser.portfolio && (
        <ProfileGrid
          posts={profileUser.portfolio.map((img, i) => ({
            id: `portfolio-${i}`,
            userId: profileUser.id,
            user: profileUser,
            type: "photo" as const,
            media: [img],
            caption: "",
            likes: 0,
            comments: 0,
            bookmarked: false,
            liked: false,
            createdAt: new Date(),
            tags: [],
          }))}
          onPostClick={() => {}}
        />
      )}

      {activeTab === "bookings" && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="font-serif text-lg">Bookings</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage your bookings in the marketplace</p>
        </div>
      )}
    </div>
  )
}
