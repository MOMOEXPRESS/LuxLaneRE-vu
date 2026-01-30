"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import { Header } from "@/components/layout/header"
import { ProfileView } from "@/components/model/profile-view"
import type { User } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

function mapVerificationLevel(status: string): "unverified" | "agency_verified" | "luxlane_verified" {
  const s = String(status).toUpperCase()
  if (s === "LUXLANE_VERIFIED") return "luxlane_verified"
  if (s === "AGENCY_VERIFIED") return "agency_verified"
  return "unverified"
}

function profileToUser(profile: Record<string, unknown>): User {
  const portfolioArr = profile.portfolio as Array<{ url?: string }> | undefined
  const portfolioUrls = Array.isArray(portfolioArr) ? portfolioArr.map((p) => (p && typeof p === "object" && "url" in p ? p.url : "")).filter(Boolean) : undefined
  return {
    id: (profile.id as string) ?? "",
    email: (profile.email as string) ?? "",
    name: (profile.name as string) ?? (profile.displayName as string) ?? "",
    username: (profile.username as string) ?? "",
    role: (profile.role as User["role"]) ?? "model",
    verified: (profile.isVerified as boolean) ?? false,
    verificationLevel: mapVerificationLevel((profile.verificationStatus as string) ?? "UNVERIFIED"),
    avatar: (profile.avatar as string) ?? (profile.avatarUrl as string) ?? "/placeholder.svg?height=400&width=400",
    bio: (profile.bio as string) ?? "",
    location: (profile.location as string) ?? "",
    followers: (profile.followers as number) ?? (profile.followersCount as number) ?? 0,
    following: (profile.following as number) ?? (profile.followingCount as number) ?? 0,
    isFollowing: profile.isFollowing as boolean | undefined,
    createdAt: new Date((profile.createdAt as string) ?? Date.now()),
    digitalTwin: profile.digitalTwin as User["digitalTwin"],
    metrics: profile.score != null ? { luxlaneScore: profile.score as number, rank: 0, rankTier: "new", trend: "stable", trendChange: 0, components: { bookings: 0, shortlists: 0, profileViews: 0, responseRate: 0, reliability: 0 }, achievements: [], lastUpdated: new Date() } : undefined,
    portfolio: portfolioUrls,
    posts: (profile.posts as User["posts"]) ?? undefined,
    measurements: profile.measurements as User["measurements"],
    languages: profile.languages as string[] | undefined,
    experience: profile.experience as string[] | undefined,
    skinTone: profile.skinTone as string | undefined,
    availabilityStatus: profile.availabilityStatus as User["availabilityStatus"],
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const username = typeof params?.username === "string" ? params.username : ""
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const res = await api.getProfile(username)
    if (res.error) {
      setError(res.error)
      setProfileUser(null)
    } else if (res.data && typeof res.data === "object" && "profile" in res.data) {
      const profile = (res.data as { profile: Record<string, unknown> }).profile
      setProfileUser(profileToUser(profile))
    } else {
      setProfileUser(null)
    }
    setLoading(false)
  }, [username])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const isOwn = isAuthenticated && currentUser?.username === username

  if (!username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Invalid profile</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack onBack={() => router.back()} title="Profile" />
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-muted-foreground">{error ?? "User not found"}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-sm text-primary underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={profileUser.name}
        showLogo={false}
        showSearch={false}
        showBack
        onBack={() => router.back()}
        showAvatar={isAuthenticated}
        onAvatarClick={isAuthenticated ? () => router.push("/") : undefined}
      />
      <ProfileView
        user={profileUser}
        isOwn={isOwn}
        onSettingsClick={() => router.push("/")}
        onMessageClick={async () => {
          const res = await api.startDirectConversation(profileUser.id)
          router.push("/?tab=inbox")
        }}
        onFollowToggle={async () => {
          if (profileUser.isFollowing) {
            await api.unfollow(profileUser.id)
          } else {
            await api.follow(profileUser.id)
          }
          loadProfile()
        }}
        onProfileUpdated={loadProfile}
      />
    </div>
  )
}
