"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { useNavigation } from "@/lib/navigation-context"
import { useNotifications } from "@/lib/hooks/use-notifications"
import type { User } from "@/lib/types"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { HomeView } from "@/components/home/home-view"
import { CastingsHub } from "@/components/castings/castings-hub"
import { CastingDetail } from "@/components/castings/casting-detail"
import { ModelsBrowse } from "@/components/models/models-browse"
import { RosterView } from "@/components/models/roster-view"
import { DiscoverView } from "@/components/model/discover-view"
import { InboxView } from "@/components/model/inbox-view"
import { ProfileView } from "@/components/model/profile-view"
import { SettingsView } from "@/components/settings/settings-view"
import { ScoreboardView } from "@/components/scoreboard/scoreboard-view"
import { VerificationFlow } from "@/components/verification/verification-flow"
import { CreateTwinFlow } from "@/components/digital-twin/create-twin-flow"
import { CompareView } from "@/components/compare/compare-view"
import { CastingRoomView } from "@/components/casting-room/casting-room"
import { BrandDashboard } from "@/components/brand/brand-dashboard"
import type { CastingRoom } from "@/lib/types"

function useViewProfile() {
  const router = useRouter()
  return (u: User) => router.push(`/u/${u.username}`)
}

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const viewProfile = useViewProfile()
  const {
    currentView,
    activeTab,
    selectedCasting,
    selectedProfile,
    compareModels,
    selectedRoom,
    navigateTo,
    setActiveTab,
    goBack,
  } = useNavigation()

  const { unreadCount } = useNotifications(true)
  const [openConversationId, setOpenConversationId] = useState<string | null>(null)

  // Read URL params for tab and conversation
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("tab") === "inbox") setActiveTab("inbox")
    if (params.get("conv")) setOpenConversationId(params.get("conv"))
  }, [setActiveTab])

  // Reset to home tab when user changes (login/logout)
  useEffect(() => {
    if (isAuthenticated && user) {
      setActiveTab("home")
    }
  }, [user?.id])

  const isBrandOrAgency = user?.role === "brand" || user?.role === "agency"

  if (!isAuthenticated) {
    return <OnboardingFlow onComplete={() => {}} />
  }

  // Verification flow - full screen
  if (currentView === "verification") {
    return <VerificationFlow onBack={() => navigateTo("settings")} onComplete={() => navigateTo("main")} />
  }

  // Create Digital Twin flow - full screen
  if (currentView === "create-twin") {
    return <CreateTwinFlow onBack={() => navigateTo("settings")} onComplete={() => navigateTo("own-profile")} />
  }

  // Scoreboard view - full screen with back
  if (currentView === "scoreboard") {
    return <ScoreboardView onBack={goBack} onViewProfile={viewProfile} />
  }

  // Compare view - full screen with back
  if (currentView === "compare" && compareModels) {
    return (
      <CompareView
        models={compareModels}
        casting={selectedCasting || undefined}
        onBack={goBack}
        onViewProfile={viewProfile}
      />
    )
  }

  // Casting Room view - full screen with back
  if (currentView === "casting-room" && selectedRoom) {
    return (
      <CastingRoomView
        room={selectedRoom}
        onBack={goBack}
        onViewProfile={viewProfile}
      />
    )
  }

  // Settings view - full screen with back
  if (currentView === "settings") {
    return (
      <SettingsView
        onBack={goBack}
        onOpenVerification={() => navigateTo("verification")}
        onOpenDigitalTwin={() => navigateTo("create-twin")}
      />
    )
  }

  // Own profile view - with persistent nav
  if (currentView === "own-profile") {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="Profile"
          showLogo={false}
          showSearch={false}
          showAvatar={false}
          showBack={true}
          onSettingsClick={() => navigateTo("settings")}
        />
        <ProfileView isOwn onSettingsClick={() => navigateTo("settings")} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
      </div>
    )
  }

  // Casting detail view - with persistent nav
  if (currentView === "casting" && selectedCasting) {
    const handleOpenRoom = async () => {
      const res = await api.getCastingRoom(selectedCasting.id)
      const data = res.data as { room?: { id: string; castingId: string; status: string; createdAt: string; casting: Record<string, unknown>; members: Array<Record<string, unknown>> } } | undefined
      if (data?.room) {
        const room: CastingRoom = {
          id: data.room.id,
          castingId: data.room.castingId,
          casting: selectedCasting,
          status: data.room.status as CastingRoom["status"],
          members: data.room.members.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            email: "",
            name: (m.name as string) || "",
            username: (m.username as string) || "",
            role: ((m.role as string) || "model") as User["role"],
            verified: false,
            verificationLevel: "unverified" as const,
            avatar: (m.avatar as string) || "",
            bio: "",
            location: (m.location as string) || "",
            followers: 0,
            following: 0,
            createdAt: new Date(),
            portfolio: [],
            polaroids: [],
            experience: [],
            tags: [],
          })),
          createdAt: new Date(data.room.createdAt),
          updatedAt: new Date(data.room.createdAt),
        }
        navigateTo("casting-room", { room, casting: selectedCasting })
      } else {
        // Create room if it doesn't exist (for casting creator)
        const createRes = await api.createCastingRoom(selectedCasting.id)
        const createData = createRes.data as { room?: { id: string; castingId: string; status: string; createdAt: string; members: Array<Record<string, unknown>> } } | undefined
        if (createData?.room) {
          const room: CastingRoom = {
            id: createData.room.id,
            castingId: createData.room.castingId,
            casting: selectedCasting,
            status: createData.room.status as CastingRoom["status"],
            members: createData.room.members.map((m: Record<string, unknown>) => ({
              id: m.id as string,
              email: "",
              name: (m.name as string) || "",
              username: (m.username as string) || "",
              role: ((m.role as string) || "model") as User["role"],
              verified: false,
              verificationLevel: "unverified" as const,
              avatar: (m.avatar as string) || "",
              bio: "",
              location: (m.location as string) || "",
              followers: 0,
              following: 0,
              createdAt: new Date(),
              portfolio: [],
              polaroids: [],
              experience: [],
              tags: [],
            })),
            createdAt: new Date(createData.room.createdAt),
            updatedAt: new Date(createData.room.createdAt),
          }
          navigateTo("casting-room", { room, casting: selectedCasting })
        }
      }
    }
    const isCreator = selectedCasting.creatorId === user?.id
    return (
      <div className="min-h-screen bg-background">
        <Header
          title={selectedCasting.title}
          showLogo={false}
          showSearch={false}
          showBack={true}
          onAvatarClick={() => navigateTo("own-profile")}
        />
        <CastingDetail
          casting={selectedCasting}
          onBack={goBack}
          onViewProfile={viewProfile}
          onViewCasting={(c) => navigateTo("casting", { casting: c })}
          onOpenRoom={isCreator ? handleOpenRoom : undefined}
        />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
      </div>
    )
  }

  // Profile detail view (other user) - with persistent nav
  if (currentView === "profile" && selectedProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title={selectedProfile.name}
          showLogo={false}
          showSearch={false}
          showBack={true}
          onAvatarClick={() => navigateTo("own-profile")}
        />
        <ProfileView
          user={selectedProfile}
          isOwn={false}
          onMessageClick={async () => {
            const res = await api.startDirectConversation(selectedProfile.id)
            const convData = res.data as { conversationId?: string } | undefined
            if (convData?.conversationId) setOpenConversationId(convData.conversationId)
            navigateTo("main")
            setActiveTab("inbox")
          }}
          onFollowToggle={async () => {
            if (selectedProfile.isFollowing) {
              await api.unfollow(selectedProfile.id)
            } else {
              await api.follow(selectedProfile.id)
            }
            navigateTo("profile", {
              profile: {
                ...selectedProfile,
                isFollowing: !selectedProfile.isFollowing,
                followers: selectedProfile.followers + (selectedProfile.isFollowing ? -1 : 1),
              },
            })
          }}
          onViewCasting={(casting) => navigateTo("casting", { casting })}
          onViewProfile={viewProfile}
        />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
      </div>
    )
  }

  // Get the title for the header based on tab
  const getHeaderTitle = () => {
    switch (activeTab) {
      case "castings":
        return isBrandOrAgency ? "Command Center" : "Castings"
      case "discover":
        return "Discover"
      case "models":
        return user?.role === "agency" ? "Scout" : "Models"
      case "roster":
        return "My Models"
      case "inbox":
        return "Inbox"
      default:
        return undefined
    }
  }

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            onViewCasting={(casting) => navigateTo("casting", { casting })}
            onViewProfile={viewProfile}
            onViewCastingsHub={() => setActiveTab("castings")}
            onViewScoreboard={() => navigateTo("scoreboard")}
          />
        )
      case "castings":
        if (isBrandOrAgency) {
          return (
            <BrandDashboard
              onViewCasting={(casting) => navigateTo("casting", { casting })}
              onViewProfile={viewProfile}
            />
          )
        }
        return <CastingsHub onViewCasting={(casting) => navigateTo("casting", { casting })} />
      case "discover":
        return (
          <DiscoverView
            onViewProfile={viewProfile}
            onViewCasting={(casting) => navigateTo("casting", { casting })}
          />
        )
      case "models":
        return (
          <ModelsBrowse
            onViewProfile={viewProfile}
            onCompare={(models) => navigateTo("compare", { models })}
          />
        )
      case "roster":
        return <RosterView onViewProfile={viewProfile} />
      case "inbox":
        return <InboxView onViewProfile={viewProfile} initialConversationId={openConversationId} />
      default:
        return null
    }
  }

  // Brand/Agency castings tab shows BrandDashboard with its own header
  if (activeTab === "castings" && isBrandOrAgency) {
    return (
      <BrandDashboard
        onViewCasting={(casting) => navigateTo("casting", { casting })}
        onViewProfile={viewProfile}
        onBack={goBack}
        bottomNav={<BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />}
      />
    )
  }

  // Main app shell with persistent header + bottom nav
  return (
    <div className="min-h-screen bg-background">
      <Header
        showLogo={activeTab === "home"}
        title={getHeaderTitle()}
        onAvatarClick={() => navigateTo("own-profile")}
      />
      {renderTabContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
    </div>
  )
}
