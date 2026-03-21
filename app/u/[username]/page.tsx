"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import { Header } from "@/components/layout/header"
import { ProfileView } from "@/components/model/profile-view"
import type { User } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { mockUsers } from "@/lib/mock-data"

function mapVerificationLevel(status: string): "unverified" | "agency_verified" | "luxlane_verified" {
  const s = String(status).toUpperCase()
  if (s === "LUXLANE_VERIFIED") return "luxlane_verified"
  if (s === "AGENCY_VERIFIED") return "agency_verified"
  return "unverified"
}

function findMockUser(profile: Record<string, unknown>) {
  const username = profile.username as string
  return mockUsers.find((u) => u.username === username || u.name === profile.name)
}

function enrichAvatar(profile: Record<string, unknown>): string {
  const apiAvatar = (profile.avatar as string) ?? (profile.avatarUrl as string) ?? ""
  if (apiAvatar && !apiAvatar.includes("placeholder")) return apiAvatar
  const mockUser = findMockUser(profile)
  return mockUser?.avatar || apiAvatar || "/placeholder.svg?height=400&width=400"
}

function enrichPolaroids(profile: Record<string, unknown>): string[] | undefined {
  const mockUser = findMockUser(profile)
  return mockUser?.polaroids
}

function enrichDigitalTwin(profile: Record<string, unknown>): User["digitalTwin"] {
  const apiTwin = profile.digitalTwin as Record<string, unknown> | null | undefined
  const mockUser = findMockUser(profile)

  // If API twin has real analysis data, use it
  if (apiTwin) {
    const summary = apiTwin.summary as Record<string, unknown> | null | undefined
    const status = (apiTwin.status as string || "").toLowerCase()
    const mappedStatus = status === "ready" ? "ready" : status === "processing" ? "processing" : status === "pending" ? "pending" : status === "failed" ? "failed" : status === "none" ? "none" : "none"

    // If API twin is ready and has attributes in summary, use real data
    if ((mappedStatus === "ready") && summary?.attributes) {
      return {
        id: (apiTwin.userId as string) || "",
        modelId: (apiTwin.userId as string) || "",
        status: "ready",
        createdAt: new Date((apiTwin.updatedAt as string) || Date.now()),
        updatedAt: new Date((apiTwin.updatedAt as string) || Date.now()),
        previewUrl: (apiTwin.previewUrl as string) || undefined,
        inputImages: (summary.inputImages as string[]) || undefined,
        attributes: summary.attributes as User["digitalTwin"] extends { attributes?: infer A } ? A : never,
      }
    }

    // Return API twin with mapped status (even if no attributes yet)
    if (mappedStatus !== "none") {
      return {
        id: (apiTwin.userId as string) || "",
        modelId: (apiTwin.userId as string) || "",
        status: mappedStatus as "pending" | "processing" | "ready" | "failed",
        createdAt: new Date((apiTwin.updatedAt as string) || Date.now()),
        updatedAt: new Date((apiTwin.updatedAt as string) || Date.now()),
      }
    }
  }

  // Fall back to mock data
  if (mockUser?.digitalTwin?.status === "complete") {
    return mockUser.digitalTwin
  }

  return undefined
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
    avatar: enrichAvatar(profile),
    bio: (profile.bio as string) ?? "",
    location: (profile.location as string) ?? "",
    followers: (profile.followers as number) ?? (profile.followersCount as number) ?? 0,
    following: (profile.following as number) ?? (profile.followingCount as number) ?? 0,
    isFollowing: profile.isFollowing as boolean | undefined,
    createdAt: new Date((profile.createdAt as string) ?? Date.now()),
    digitalTwin: enrichDigitalTwin(profile),
    metrics: profile.score != null ? { luxlaneScore: profile.score as number, rank: 0, rankTier: "new", trend: "stable", trendChange: 0, components: { bookings: 0, shortlists: 0, profileViews: 0, responseRate: 0, reliability: 0 }, achievements: [], lastUpdated: new Date() } : undefined,
    portfolio: portfolioUrls,
    posts: (profile.posts as User["posts"]) ?? undefined,
    measurements: profile.measurements as User["measurements"],
    languages: profile.languages as string[] | undefined,
    experience: profile.experience as string[] | undefined,
    skinTone: profile.skinTone as string | undefined,
    availabilityStatus: profile.availabilityStatus as User["availabilityStatus"],
    polaroids: enrichPolaroids(profile),
    roster: profile.roster as string[] | undefined,
    companyName: profile.companyName as string | undefined,
    website: profile.website as string | undefined,
    industry: profile.industry as string | undefined,
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
