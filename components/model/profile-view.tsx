"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { useStore } from "@/lib/store-context"
import type { User, Casting } from "@/lib/types"
import { AvailabilityCalendar } from "./availability-calendar"
import { JobHistory } from "./job-history"
import { ShareProfile } from "./share-profile"
import { ProfileAnalytics } from "@/components/analytics/profile-analytics"
import { EarningsDashboard } from "@/components/analytics/earnings-dashboard"
import { StoryHighlights } from "@/components/stories/story-highlights"
import {
  BadgeCheck,
  MapPin,
  Settings,
  Share2,
  MessageCircle,
  Grid3X3,
  Calendar,
  Edit,
  MessageSquare,
  UserPlus,
  Star,
  TrendingUp,
  Globe,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  CheckCircle,
  Users,
  MoreHorizontal,
  ShieldAlert,
  Ban,
  Heart,
  Trash2,
  GripVertical,
  Instagram,
  Camera,
} from "lucide-react"
import { uploadAvatar } from "@/lib/upload"
import { mockUsers } from "@/lib/mock-data"

type ProfileTab = "portfolio" | "posts" | "details" | "availability"

interface ProfileViewProps {
  user?: User
  isOwn?: boolean
  onSettingsClick?: () => void
  onMessageClick?: () => void
  onInviteToCasting?: (casting: Casting) => void
  onProfileUpdated?: () => void
  onFollowToggle?: () => void
  onViewCasting?: (casting: Casting) => void
  onViewProfile?: (user: User) => void
}

export function ProfileView({
  user: profileUser,
  isOwn = true,
  onSettingsClick,
  onMessageClick,
  onInviteToCasting,
  onProfileUpdated,
  onFollowToggle,
  onViewCasting,
  onViewProfile,
}: ProfileViewProps) {
  const { user: currentUser } = useAuth()
  const { castings } = useStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>("portfolio")
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all")
  const [dbPortfolio, setDbPortfolio] = useState<Array<{ id: string; url: string; type: string; meta?: any }>>([])
  const [dbPosts, setDbPosts] = useState<Array<{ id: string; imageUrl: string; caption?: string | null; createdAt: string }>>([])
  const [liveMeasurements, setLiveMeasurements] = useState<typeof user.measurements | undefined>(undefined)
  const [agencyInfo, setAgencyInfo] = useState<{ id: string; name: string; avatar?: string; location?: string } | null>(null)

  // Resolve the user (prop or current auth user)
  const resolvedUserId = profileUser?.id || currentUser?.id

  // Fetch portfolio + posts + measurements from DB on mount and after updates
  const fetchProfileData = useCallback(async () => {
    if (!resolvedUserId) return
    // Portfolio
    const mediaRes = await api.getMedia(resolvedUserId, "PORTFOLIO")
    const mediaData = mediaRes.data as { media?: Array<{ id: string; url: string; type: string; meta?: any }> } | undefined
    if (mediaData?.media) setDbPortfolio(mediaData.media)

    // Posts
    const postsRes = await api.getPosts({ limit: 50 })
    const postsData = postsRes.data as { posts?: Array<{ id: string; userId: string; imageUrl: string; caption?: string | null; createdAt: string }> } | undefined
    if (postsData?.posts) {
      setDbPosts(postsData.posts.filter((p) => p.userId === resolvedUserId))
    }

    // Refresh measurements + agency from profile API
    const profileRes = await api.getMyProfile()
    const profileData = profileRes.data as { profile?: { measurements?: any; agencyId?: string; agencyName?: string; agencyAvatar?: string; agencyLocation?: string } } | undefined
    if (profileData?.profile?.measurements) {
      setLiveMeasurements(profileData.profile.measurements)
    }
    if (profileData?.profile?.agencyId) {
      setAgencyInfo({
        id: profileData.profile.agencyId,
        name: profileData.profile.agencyName || "Agency",
        avatar: profileData.profile.agencyAvatar,
        location: profileData.profile.agencyLocation,
      })
    }
  }, [resolvedUserId])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showCreatePostSheet, setShowCreatePostSheet] = useState(false)
  const [newPostImage, setNewPostImage] = useState("")
  const [newPostCaption, setNewPostCaption] = useState("")
  const [postCreating, setPostCreating] = useState(false)
  const [showInviteSheet, setShowInviteSheet] = useState(false)
  const [showEditDetailsSheet, setShowEditDetailsSheet] = useState(false)
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [showAddPortfolioSheet, setShowAddPortfolioSheet] = useState(false)
  const [addPortfolioUrl, setAddPortfolioUrl] = useState("")
  const [addPortfolioSaving, setAddPortfolioSaving] = useState(false)
  const [addPortfolioError, setAddPortfolioError] = useState<string | null>(null)
  const [portfolioCategory, setPortfolioCategory] = useState<string>("all")

  const [hasAppliedToAgency, setHasAppliedToAgency] = useState(false)
  const [showAgencyApplySheet, setShowAgencyApplySheet] = useState(false)
  const [agencyApplyStep, setAgencyApplyStep] = useState(1)
  const [agencyApplyNote, setAgencyApplyNote] = useState("")
  const [agencyApplyLoading, setAgencyApplyLoading] = useState(false)
  const [agencyApplyError, setAgencyApplyError] = useState<string | null>(null)

  // Block/Report/Save state
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showReportSheet, setShowReportSheet] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [reportSending, setReportSending] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isSavedModel, setIsSavedModel] = useState(false)

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Portfolio management state
  const [editingPortfolio, setEditingPortfolio] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<Array<{ id: string; url: string }>>([])
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null)

  const user = profileUser || currentUser
  // Use live measurements (from DB fetch) if available, otherwise fall back to user prop
  const measurements = liveMeasurements || user?.measurements
  const isBrandOrAgency = currentUser?.role === "brand" || currentUser?.role === "agency"

  // Check block status + track profile view for non-own profiles
  useEffect(() => {
    if (!isOwn && user?.username) {
      api.checkBlocked(user.username).then((res) => {
        const data = res.data as { blocked?: boolean } | undefined
        if (data) setIsBlocked(!!data.blocked)
      })
      // Track profile view
      api.trackProfileView(user.id, "direct")
    }
  }, [isOwn, user?.username, user?.id])

  const handleBlock = async () => {
    if (!user) return
    if (isBlocked) {
      await api.unblockUser(user.username)
      setIsBlocked(false)
    } else {
      await api.blockUser(user.username)
      setIsBlocked(true)
    }
    setShowMoreMenu(false)
  }

  const handleReport = async () => {
    if (!user || !reportReason) return
    setReportSending(true)
    await api.reportUser(user.username, reportReason, reportDetails || undefined)
    setReportSending(false)
    setReportSent(true)
    setTimeout(() => {
      setShowReportSheet(false)
      setReportSent(false)
      setReportReason("")
      setReportDetails("")
    }, 1500)
  }

  const handleSaveModel = async () => {
    if (!user) return
    if (isSavedModel) {
      await api.unsaveModel(user.id)
      setIsSavedModel(false)
    } else {
      await api.saveModel(user.id)
      setIsSavedModel(true)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const url = await uploadAvatar(file)
    if (url) {
      setAvatarUrl(url)
      onProfileUpdated?.()
    }
    setAvatarUploading(false)
  }

  const handleDeletePortfolioItem = async (mediaId: string) => {
    setDeletingMedia(mediaId)
    await api.deleteMedia(mediaId)
    setPortfolioItems((prev) => prev.filter((p) => p.id !== mediaId))
    setDeletingMedia(null)
  }

  if (!user) return null

  // Get user's castings for invite
  const myCastings = castings.filter((c) => c.creatorId === currentUser?.id && c.status === "active")

  // Agency-specific data
  const isAgency = user.role === "agency"
  // For agencies, try to find roster from the user object or fallback to mockUsers by username/name match
  const agencyMockUser = isAgency
    ? mockUsers.find((mu) => mu.role === "agency" && (mu.username === user.username || mu.id === user.id || mu.name === user.name))
    : null
  const rosterIds = user.roster || agencyMockUser?.roster || []
  const rosterModels = isAgency && rosterIds.length > 0
    ? mockUsers.filter((u) => rosterIds.includes(u.id))
    : []
  // Match agency castings by user ID or by the mockUser ID
  const agencyCastings = isAgency
    ? castings.filter((c) => c.creatorId === user.id || (agencyMockUser && c.creatorId === agencyMockUser.id))
    : []
  const canApplyToAgency = !isOwn && isAgency && currentUser?.role === "model"

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "portfolio", label: "Portfolio", icon: <Grid3X3 className="w-4 h-4" /> },
    { id: "posts", label: "Posts", icon: <Grid3X3 className="w-4 h-4" /> },
    { id: "details", label: "Details", icon: <Briefcase className="w-4 h-4" /> },
    { id: "availability", label: "Availability", icon: <Calendar className="w-4 h-4" /> },
  ]

  const portfolioFilters = ["all", "runway", "editorial", "campaign", "commercial"]

  const getVerificationBadge = () => {
    if (!user.verified) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Unverified
        </Badge>
      )
    }
    if (user.verificationLevel === "luxlane") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <BadgeCheck className="w-3 h-3 mr-1" />
          Luxlane Verified
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <BadgeCheck className="w-3 h-3 mr-1" />
        Agency Verified
      </Badge>
    )
  }

  // Use DB-fetched portfolio images, fall back to user.portfolio for static data
  const filteredPortfolio = portfolioFilter === "all"
    ? dbPortfolio
    : dbPortfolio.filter((p) => p.meta?.category === portfolioFilter)
  const allImages = filteredPortfolio.length > 0 || dbPortfolio.length > 0
    ? filteredPortfolio.map((p) => p.url)
    : (user.portfolio || [])

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
    setLightboxImage(allImages[lightboxIndex > 0 ? lightboxIndex - 1 : allImages.length - 1])
  }

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
    setLightboxImage(allImages[lightboxIndex < allImages.length - 1 ? lightboxIndex + 1 : 0])
  }

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="px-4 py-6">
        <div className="flex items-start justify-between mb-4">
          <div className="relative group">
            <Avatar className="w-20 h-20 ring-2 ring-border">
              <AvatarImage src={avatarUrl || user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            {isOwn && (
              <>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {avatarUploading ? (
                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </>
            )}
          </div>
          <div className="flex gap-2">
            {!isOwn && isBrandOrAgency && user.role === "model" && (
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full bg-transparent ${isSavedModel ? "text-red-500 border-red-500/30" : ""}`}
                onClick={handleSaveModel}
              >
                <Heart className={`w-4 h-4 ${isSavedModel ? "fill-current" : ""}`} />
              </Button>
            )}
            <ShareProfile username={user.username} displayName={user.name} />
            {isOwn && (
              <Button variant="outline" size="icon" className="rounded-full bg-transparent" onClick={onSettingsClick}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
            {!isOwn && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-transparent"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-10 z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                    <button
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2"
                      onClick={() => { setShowReportSheet(true); setShowMoreMenu(false) }}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Report
                    </button>
                    <button
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 text-red-500"
                      onClick={handleBlock}
                    >
                      <Ban className="w-4 h-4" />
                      {isBlocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Name + Verification */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{user.name}</h1>
            {getVerificationBadge()}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {user.location}
            </p>
          )}
          {user.socialLinks && (
            <div className="flex items-center gap-3 mt-2">
              {user.socialLinks.instagram && (
                <a href={`https://instagram.com/${user.socialLinks.instagram}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                  <Instagram className="w-4 h-4" /> @{user.socialLinks.instagram}
                </a>
              )}
              {user.socialLinks.tiktok && (
                <a href={`https://tiktok.com/@${user.socialLinks.tiktok}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                  <span className="w-4 h-4 font-bold text-xs">TT</span> @{user.socialLinks.tiktok}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Row - Model Specific */}
        {user.role === "model" && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4">
            {measurements?.height && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="font-semibold text-sm">{measurements?.height}</p>
              </Card>
            )}
            {measurements && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">Measurements</p>
                <p className="font-semibold text-sm">
                  {measurements?.bust}/{measurements?.waist}/{measurements?.hips}
                </p>
              </Card>
            )}
            {user.experience && user.experience.length > 0 && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="font-semibold text-sm">{user.experience[0]}</p>
              </Card>
            )}
            {user.score && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Score
                </p>
                <p className="font-semibold text-sm flex items-center gap-1">
                  {user.score}
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Social Stats */}
        <div className="flex gap-6 mt-4">
          <div>
            <p className="font-semibold">{user.followers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div>
            <p className="font-semibold">{user.following.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          {isAgency && rosterModels.length > 0 && (
            <div>
              <p className="font-semibold">{rosterModels.length}</p>
              <p className="text-xs text-muted-foreground">Talent</p>
            </div>
          )}
          {isAgency && agencyCastings.length > 0 && (
            <div>
              <p className="font-semibold">{agencyCastings.length}</p>
              <p className="text-xs text-muted-foreground">Castings</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isOwn && (
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1"
              variant={user.isFollowing ? "outline" : "default"}
              onClick={onFollowToggle}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {user.isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onMessageClick}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            {isBrandOrAgency && user.role === "model" && (
              <>
                <Button variant="outline" onClick={() => setShowInviteSheet(true)}>
                  Invite
                </Button>
                {currentUser?.role === "agency" && (
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={async () => {
                      const res = await api.inviteModelToAgency(user.id)
                      if (res.error) alert(res.error)
                      else alert("Invitation sent!")
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Roster
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        {isOwn && (
          <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => setShowEditDetailsSheet(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Agency: Apply Button */}
      {canApplyToAgency && (
        <div className="px-4 py-3">
          {hasAppliedToAgency ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Application Sent</span>
            </div>
          ) : (
            <Button
              onClick={() => {
                setAgencyApplyStep(1)
                setAgencyApplyNote("")
                setAgencyApplyError(null)
                setShowAgencyApplySheet(true)
              }}
              className="w-full h-12 rounded-xl font-semibold text-base"
            >
              <Send className="w-4 h-4 mr-2" />
              Apply to {user.name}
            </Button>
          )}
        </div>
      )}

      {/* Agency: Talent Roster */}
      {isAgency && rosterModels.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Talent Roster
            </h3>
            <span className="text-sm text-muted-foreground">{rosterModels.length} models</span>
          </div>
          <div className="space-y-2">
            {rosterModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => onViewProfile?.(model)}
              >
                <Avatar className="w-12 h-12 ring-1 ring-border">
                  <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
                  <AvatarFallback>{model.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">{model.name}</span>
                    {model.verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{model.location}</p>
                  {model.measurements?.height && (
                    <p className="text-xs text-muted-foreground">{model.measurements.height}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agency: Active Castings */}
      {isAgency && agencyCastings.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Active Castings
            </h3>
            <span className="text-sm text-muted-foreground">{agencyCastings.length}</span>
          </div>
          <div className="space-y-2">
            {agencyCastings.map((casting) => (
              <div
                key={casting.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => onViewCasting?.(casting)}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={casting.images?.[0] || "/placeholder.svg"}
                    alt={casting.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{casting.title}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {casting.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {casting.location}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {casting.applicationsCount} applicants
                    {casting.pay.amount > 0 && ` · ${casting.pay.currency} ${casting.pay.amount.toLocaleString()}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story Highlights */}
      <div className="px-4 pb-2">
        <StoryHighlights userId={user.id} isOwn={isOwn} />
      </div>

      {/* Tabs Navigation */}
      {user.role === "model" && (
        <>
          <div className="flex justify-around border-b border-border sticky top-14 bg-background z-30 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "portfolio" && (
              <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Portfolio Filters */}
                <div className="px-4 py-3 flex gap-2 overflow-x-auto">
                  {portfolioFilters.map((filter) => (
                    <Button
                      key={filter}
                      variant={portfolioFilter === filter ? "default" : "outline"}
                      size="sm"
                      className="flex-shrink-0 capitalize"
                      onClick={() => setPortfolioFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>

                {/* Portfolio Edit Toggle */}
                {isOwn && user.role === "model" && allImages.length > 0 && (
                  <div className="flex justify-end px-2 mb-2">
                    <Button
                      variant={editingPortfolio ? "default" : "ghost"}
                      size="sm"
                      className="text-xs"
                      onClick={async () => {
                        if (!editingPortfolio) {
                          // Fetch media assets with IDs for editing
                          const res = await api.getMedia(user.id, "PORTFOLIO")
                          const data = res.data as { assets?: Array<{ id: string; url: string; sortOrder?: number }> } | undefined
                          if (data?.assets) {
                            setPortfolioItems(data.assets.map((a) => ({ id: a.id, url: a.url })))
                          }
                        }
                        setEditingPortfolio(!editingPortfolio)
                      }}
                    >
                      {editingPortfolio ? "Done" : <><Edit className="w-3 h-3 mr-1" /> Manage</>}
                    </Button>
                  </div>
                )}

                {/* Portfolio Grid */}
                <div className="relative">
                  {/* Floating add button */}
                  {isOwn && user.role === "model" && (
                    <button
                      onClick={() => setShowAddPortfolioSheet(true)}
                      className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                <div className="grid grid-cols-3 gap-0.5 p-0.5">
                  {editingPortfolio ? (
                    // Edit mode: show portfolio items with delete buttons
                    portfolioItems.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="aspect-[3/4] bg-muted relative group overflow-hidden"
                      >
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={`Portfolio ${i + 1}`}
                          className="w-full h-full object-cover opacity-75"
                        />
                        <button
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                          onClick={() => handleDeletePortfolioItem(item.id)}
                          disabled={deletingMedia === item.id}
                        >
                          {deletingMedia === item.id ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <div className="absolute bottom-1 left-1 w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    // Normal view mode
                    allImages.map((img, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="aspect-[3/4] bg-muted relative group overflow-hidden"
                        onClick={() => {
                          setLightboxImage(img)
                          setLightboxIndex(i)
                        }}
                      >
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Portfolio ${i + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </motion.button>
                    ))
                  )}
                  {allImages.length === 0 && !editingPortfolio && (
                    <div className="col-span-3 py-12 text-center text-muted-foreground">
                      {isOwn ? "Tap + to add your first photo" : "No portfolio images yet"}
                    </div>
                  )}
                </div>
                </div>
              </motion.div>
            )}

            {activeTab === "posts" && (
              <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                {/* Floating add post button - same style as portfolio */}
                {isOwn && (
                  <button
                    onClick={() => setShowCreatePostSheet(true)}
                    className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
                {(dbPosts.length > 0 || (user.posts && user.posts.length > 0)) ? (
                  <div className="grid grid-cols-3 gap-0.5 p-0.5">
                    {(dbPosts.length > 0 ? dbPosts : user.posts || []).map((post) => (
                      <button
                        key={post.id}
                        className="aspect-square bg-muted overflow-hidden relative group"
                        onClick={() => {
                          setLightboxImage(post.imageUrl)
                          setLightboxIndex(0)
                        }}
                      >
                        <img
                          src={post.imageUrl || "/placeholder.svg"}
                          alt={post.caption ?? "Post"}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {/* Hover overlay with like/comment counts */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-medium">
                          <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {(post as any).likes ?? 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {(post as any).comments ?? 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground px-4">
                    <Grid3X3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No posts yet</p>
                    <p className="text-xs mt-1">Share your first moment</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {isOwn && user.role === "model" && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowEditDetailsSheet(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit details
                    </Button>
                  </div>
                )}

                {/* Human Silhouette with Measurements */}
                <div className="relative flex justify-center py-4">
                  {/* SVG Silhouette */}
                  <div className="relative" style={{ width: 160, height: 340 }}>
                    <svg viewBox="0 0 160 340" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Head */}
                      <circle cx="80" cy="30" r="22" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Neck */}
                      <line x1="80" y1="52" x2="80" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Shoulders */}
                      <line x1="40" y1="75" x2="120" y2="75" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Torso */}
                      <path d="M 40 75 L 45 140 L 55 160 L 105 160 L 115 140 L 120 75" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Waist line */}
                      <line x1="50" y1="130" x2="110" y2="130" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="text-muted-foreground/20" />
                      {/* Hips */}
                      <path d="M 55 160 L 50 170 L 120 170 L 105 160" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Left leg */}
                      <path d="M 55 170 L 50 260 L 48 310" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Right leg */}
                      <path d="M 105 170 L 110 260 L 112 310" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Left arm */}
                      <path d="M 40 75 L 25 130 L 20 160" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Right arm */}
                      <path d="M 120 75 L 135 130 L 140 160" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      {/* Feet */}
                      <line x1="42" y1="310" x2="55" y2="310" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                      <line x1="106" y1="310" x2="118" y2="310" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
                    </svg>

                    {/* Measurement labels positioned around the figure */}
                    {/* Hair — top left */}
                    <div className="absolute -left-20 top-2 text-right w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Hair</p>
                      <p className="text-xs font-semibold">{measurements?.hairColor || "—"}</p>
                    </div>

                    {/* Eyes — top right */}
                    <div className="absolute -right-20 top-2 text-left w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Eyes</p>
                      <p className="text-xs font-semibold">{measurements?.eyeColor || "—"}</p>
                    </div>

                    {/* Height — left, upper */}
                    <div className="absolute -left-20 top-[75px] text-right w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Height</p>
                      <p className="text-sm font-bold text-foreground">{measurements?.height || "—"}</p>
                    </div>

                    {/* Bust — right of chest */}
                    <div className="absolute -right-20 top-[90px] text-left w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Bust</p>
                      <p className="text-xs font-semibold">{measurements?.bust || "—"}</p>
                    </div>

                    {/* Waist — left of waist */}
                    <div className="absolute -left-20 top-[130px] text-right w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Waist</p>
                      <p className="text-xs font-semibold">{measurements?.waist || "—"}</p>
                    </div>

                    {/* Hips — right of hips */}
                    <div className="absolute -right-20 top-[165px] text-left w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Hips</p>
                      <p className="text-xs font-semibold">{measurements?.hips || "—"}</p>
                    </div>

                    {/* Dress Size — left, lower */}
                    <div className="absolute -left-20 top-[200px] text-right w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Dress</p>
                      <p className="text-xs font-semibold">{measurements?.dressSize || "—"}</p>
                    </div>

                    {/* Inseam/Leg — right, lower */}
                    <div className="absolute -right-20 top-[240px] text-left w-20">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Skin</p>
                      <p className="text-xs font-semibold">{user.skinTone || "—"}</p>
                    </div>

                    {/* Shoe Size — bottom */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Shoes</p>
                      <p className="text-xs font-semibold">{measurements?.shoeSize || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                {user.languages && user.languages.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.languages.map((lang, i) => (
                        <Badge key={i} variant="secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Experience Tags */}
                {user.experience && user.experience.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Experience</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.experience.map((exp, i) => (
                        <Badge key={i} variant="outline">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Agency — show from DB agencyInfo or static user data */}
                {(agencyInfo || (user.agencyId && user.agencyName)) && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Represented By</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={agencyInfo?.avatar || user.agencyAvatar || "/placeholder.svg"} />
                          <AvatarFallback>{(agencyInfo?.name || user.agencyName)?.[0] || "A"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agencyInfo?.name || user.agencyName}</p>
                          <p className="text-sm text-muted-foreground">{agencyInfo?.location || user.agencyLocation || "Agency"}</p>
                        </div>
                      </div>
                      {/* Leave agency button for own profile */}
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400"
                          onClick={async () => {
                            if (!confirm("Leave this agency? You can reapply later.")) return
                            // Call leave agency API (model removes themselves)
                            const res = await api.updateModelProfile({ agencyId: null })
                            if (!res.error) {
                              setAgencyInfo(null)
                              fetchProfileData()
                            }
                          }}
                        >
                          Leave
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === "availability" && (
              <motion.div
                key="availability"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Availability Status */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Current Status</h3>
                    <Badge
                      className={
                        user.availabilityStatus === "available"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : user.availabilityStatus === "hold"
                            ? "bg-amber-500/10 text-amber-600"
                            : user.availabilityStatus === "booked"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-muted text-muted-foreground"
                      }
                    >
                      {user.availabilityStatus === "available"
                        ? "Available"
                        : user.availabilityStatus === "hold"
                          ? "On Hold"
                          : user.availabilityStatus === "booked"
                            ? "Booked"
                            : "—"}
                    </Badge>
                  </div>
                  {isOwn && user.role === "model" && (
                    <div className="flex gap-2">
                      <Button
                        variant={user.availabilityStatus === "available" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          const res = await api.updateModelProfile({ availability: "AVAILABLE" })
                          if (!res.error) onProfileUpdated?.()
                        }}
                      >
                        Available
                      </Button>
                      <Button
                        variant={user.availabilityStatus === "hold" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          const res = await api.updateModelProfile({ availability: "HOLD" })
                          if (!res.error) onProfileUpdated?.()
                        }}
                      >
                        On Hold
                      </Button>
                      <Button
                        variant={user.availabilityStatus === "booked" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          const res = await api.updateModelProfile({ availability: "BOOKED" })
                          if (!res.error) onProfileUpdated?.()
                        }}
                      >
                        Booked
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Full Calendar */}
                <AvailabilityCalendar userId={user.id} isOwn={isOwn} />

                {/* Job History — only for own profile */}
                {isOwn && user.role === "model" && <JobHistory />}
              </motion.div>
            )}

            {/* Analytics tab — own profile only */}
          </AnimatePresence>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <motion.img
              key={lightboxImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage}
              alt="Portfolio"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite to Casting Sheet */}
      <Sheet open={showInviteSheet} onOpenChange={setShowInviteSheet}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Invite to Casting</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {myCastings.length > 0 ? (
              myCastings.map((casting) => (
                <Card
                  key={casting.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={async () => {
                    const res = await api.inviteModelToCasting(casting.id, user.id)
                    if (res.error) {
                      alert(res.error)
                    } else {
                      setShowInviteSheet(false)
                    }
                  }}
                >
                  <h4 className="font-medium">{casting.title}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{casting.type}</p>
                  <p className="text-xs text-muted-foreground">{casting.location}</p>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active castings</p>
                <p className="text-sm">Create a casting first to invite models</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Portfolio Photo Sheet */}
      <Sheet open={showAddPortfolioSheet} onOpenChange={setShowAddPortfolioSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Add portfolio photo</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {addPortfolioError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{addPortfolioError}</p>
            )}

            {/* Category selector */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <div className="flex gap-2 flex-wrap">
                {["runway", "editorial", "campaign", "commercial"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPortfolioCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                      portfolioCategory === cat
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload button */}
            <div>
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <div className="text-center">
                  {addPortfolioSaving ? (
                    <>
                      <div className="w-8 h-8 mx-auto border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
                      <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Tap to upload photo</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={addPortfolioSaving}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setAddPortfolioSaving(true)
                    setAddPortfolioError(null)
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("type", "portfolio")
                    try {
                      const uploadRes = await fetch("/api/media/upload", { method: "POST", credentials: "include", body: formData })
                      if (uploadRes.ok) {
                        const data = await uploadRes.json()
                        if (data.url) {
                          await api.confirmMedia({ url: data.url, type: "PORTFOLIO", meta: { category: portfolioCategory } })
                          setShowAddPortfolioSheet(false)
                          setPortfolioCategory("all")
                          fetchProfileData()
                          onProfileUpdated?.()
                        }
                      } else {
                        setAddPortfolioError("Upload failed. Try again.")
                      }
                    } catch {
                      setAddPortfolioError("Something went wrong.")
                    }
                    setAddPortfolioSaving(false)
                  }}
                />
              </label>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setShowAddPortfolioSheet(false)}>
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Post Sheet */}
      <Sheet open={showCreatePostSheet} onOpenChange={setShowCreatePostSheet}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Create Post</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-muted-foreground/50 transition-colors overflow-hidden">
              {newPostImage ? (
                <img src={newPostImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Tap to upload photo</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append("file", file)
                  formData.append("type", "post")
                  const res = await fetch("/api/media/upload", { method: "POST", credentials: "include", body: formData })
                  if (res.ok) {
                    const data = await res.json()
                    setNewPostImage(data.url || "")
                  }
                }}
              />
            </label>
            <Input
              placeholder="Write a caption..."
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              maxLength={500}
            />
            <Button
              className="w-full h-12"
              disabled={!newPostImage.trim() || postCreating}
              onClick={async () => {
                setPostCreating(true)
                const res = await api.createPost({ imageUrl: newPostImage.trim(), caption: newPostCaption.trim() || undefined })
                setPostCreating(false)
                if (!res.error) {
                  setShowCreatePostSheet(false)
                  setNewPostImage("")
                  setNewPostCaption("")
                  fetchProfileData()
                }
              }}
            >
              {postCreating ? "Posting..." : "Post"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Report User Sheet */}
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Report {user.name}</SheetTitle>
          </SheetHeader>
          {reportSent ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <p className="font-medium">Report submitted</p>
              <p className="text-sm text-muted-foreground">We'll review this report shortly.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <div className="flex flex-wrap gap-2">
                  {["spam", "harassment", "inappropriate", "fake", "other"].map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={reportReason === r ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportReason(r)}
                      className="capitalize"
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportDetails">Details (optional)</Label>
                <Input
                  id="reportDetails"
                  placeholder="Tell us more about the issue..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleReport} disabled={!reportReason || reportSending}>
                  {reportSending ? "Sending..." : "Submit report"}
                </Button>
                <Button variant="outline" onClick={() => setShowReportSheet(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Details Sheet */}
      <EditDetailsSheet
        user={user}
        open={showEditDetailsSheet}
        onOpenChange={setShowEditDetailsSheet}
        saving={detailsSaving}
        setSaving={setDetailsSaving}
        error={detailsError}
        setError={setDetailsError}
        onSuccess={() => {
          setShowEditDetailsSheet(false)
          fetchProfileData() // This refreshes measurements, portfolio, and posts
          onProfileUpdated?.()
        }}
      />

      {/* Agency Application Sheet */}
      <Sheet open={showAgencyApplySheet} onOpenChange={setShowAgencyApplySheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {agencyApplyStep === 1 && "Review Your Profile"}
              {agencyApplyStep === 2 && "Cover Letter"}
              {agencyApplyStep === 3 && "Submit Application"}
            </SheetTitle>
          </SheetHeader>

          {/* Step indicators */}
          <div className="flex gap-1 mt-4 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${s <= agencyApplyStep ? "bg-foreground" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="space-y-6">
            {/* Step 1: Profile Review */}
            {agencyApplyStep === 1 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Your profile will be sent to {user.name}. Make sure it's up to date.
                </p>
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{currentUser?.name}</p>
                      <p className="text-sm text-muted-foreground">@{currentUser?.username}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{currentUser?.location || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Height</p>
                      <p className="text-sm font-medium">{currentUser?.measurements?.height || "Not set"}</p>
                    </div>
                  </div>
                </Card>
                <Button className="w-full" onClick={() => setAgencyApplyStep(2)}>Continue</Button>
              </>
            )}

            {/* Step 2: Cover Note */}
            {agencyApplyStep === 2 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Tell {user.name} why you'd be a great fit for their roster.
                </p>
                <textarea
                  value={agencyApplyNote}
                  onChange={(e) => setAgencyApplyNote(e.target.value)}
                  placeholder="I'm passionate about high fashion and believe your agency aligns perfectly with my career goals..."
                  className="w-full min-h-[120px] rounded-xl border border-border bg-transparent p-3 text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setAgencyApplyStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={() => setAgencyApplyStep(3)}>Continue</Button>
                </div>
              </>
            )}

            {/* Step 3: Summary + Submit */}
            {agencyApplyStep === 3 && (
              <>
                <Card className="p-4">
                  <h4 className="font-medium text-sm mb-2">Application Summary</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>📋 Profile info included</p>
                    <p>🖼 {currentUser?.portfolio?.length || 0} portfolio photos</p>
                    {agencyApplyNote.trim() && <p>💬 Cover letter included</p>}
                  </div>
                </Card>

                <p className="text-sm text-muted-foreground">
                  Applying to <span className="font-medium text-foreground">{user.name}</span>
                </p>

                {agencyApplyError && (
                  <p className="text-sm text-red-500 text-center">{agencyApplyError}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setAgencyApplyStep(2)}>Back</Button>
                  <Button
                    className="flex-1"
                    disabled={agencyApplyLoading}
                    onClick={async () => {
                      setAgencyApplyLoading(true)
                      setAgencyApplyError(null)
                      const res = await api.applyToAgency(user.id, agencyApplyNote.trim() || undefined)
                      setAgencyApplyLoading(false)
                      if (res.error) {
                        setAgencyApplyError(res.error)
                        return
                      }
                      setShowAgencyApplySheet(false)
                      setHasAppliedToAgency(true)
                    }}
                  >
                    {agencyApplyLoading ? "Submitting…" : "Submit Application"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function EditDetailsSheet({
  user,
  open,
  onOpenChange,
  saving,
  setSaving,
  error,
  setError,
  onSuccess,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  setSaving: (v: boolean) => void
  error: string | null
  setError: (v: string | null) => void
  onSuccess: () => void
}) {
  const parseNum = (s: string | undefined): number | undefined => {
    if (s == null || s === "") return undefined
    const n = parseInt(s, 10)
    return Number.isNaN(n) ? undefined : n
  }
  const [heightCm, setHeightCm] = useState("")
  const [bustCm, setBustCm] = useState("")
  const [waistCm, setWaistCm] = useState("")
  const [hipsCm, setHipsCm] = useState("")
  const [shoeSize, setShoeSize] = useState("")
  const [dressSize, setDressSize] = useState("")
  const [hair, setHair] = useState("")
  const [eyes, setEyes] = useState("")
  const [skinTone, setSkinTone] = useState("")
  const [languagesStr, setLanguagesStr] = useState("")
  const [experienceStr, setExperienceStr] = useState("")

  useEffect(() => {
    if (!open) return
    setHeightCm(measurements?.heightCm != null ? String(measurements?.heightCm) : "")
    setBustCm(
      measurements?.bust != null && measurements?.bust !== ""
        ? String(measurements?.bust.replace(/\s*cm\s*/i, ""))
        : "",
    )
    setWaistCm(
      measurements?.waist != null && measurements?.waist !== ""
        ? String(measurements?.waist.replace(/\s*cm\s*/i, ""))
        : "",
    )
    setHipsCm(
      measurements?.hips != null && measurements?.hips !== ""
        ? String(measurements?.hips.replace(/\s*cm\s*/i, ""))
        : "",
    )
    setShoeSize(measurements?.shoeSize ?? "")
    setDressSize(measurements?.dressSize ?? "")
    setHair(measurements?.hairColor ?? "")
    setEyes(measurements?.eyeColor ?? "")
    setSkinTone(user.skinTone ?? "")
    setLanguagesStr(Array.isArray(user.languages) ? user.languages.join(", ") : "")
    setExperienceStr(Array.isArray(user.experience) ? user.experience.join(", ") : "")
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const h = parseNum(heightCm)
    const b = parseNum(bustCm)
    const w = parseNum(waistCm)
    const hi = parseNum(hipsCm)
    const langs = languagesStr
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const exp = experienceStr
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const res = await api.updateModelProfile({
      ...(h != null && { heightCm: h }),
      ...(b != null && { bustCm: b }),
      ...(w != null && { waistCm: w }),
      ...(hi != null && { hipsCm: hi }),
      ...(shoeSize.trim() && { shoeSize: shoeSize.trim() }),
      ...(hair.trim() && { hair: hair.trim() }),
      ...(eyes.trim() && { eyes: eyes.trim() }),
      ...(langs.length > 0 && { languages: langs }),
      details: {
        ...(dressSize.trim() && { dressSize: dressSize.trim() }),
        ...(skinTone.trim() && { skinTone: skinTone.trim() }),
        ...(exp.length > 0 && { experience: exp }),
      },
    })
    setSaving(false)
    if (res.error) {
      setError(
        res.error.toLowerCase().includes("not authenticated") || res.error.toLowerCase().includes("authenticated")
          ? "Your session may have expired. Please log in again."
          : res.error,
      )
      return
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit details</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                min={120}
                max={220}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bustCm">Bust (cm)</Label>
              <Input
                id="bustCm"
                type="number"
                min={50}
                max={200}
                value={bustCm}
                onChange={(e) => setBustCm(e.target.value)}
                placeholder="86"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waistCm">Waist (cm)</Label>
              <Input
                id="waistCm"
                type="number"
                min={40}
                max={150}
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                placeholder="64"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hipsCm">Hips (cm)</Label>
              <Input
                id="hipsCm"
                type="number"
                min={50}
                max={200}
                value={hipsCm}
                onChange={(e) => setHipsCm(e.target.value)}
                placeholder="90"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shoeSize">Shoe size</Label>
              <Input
                id="shoeSize"
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                placeholder="EU 39"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dressSize">Dress size</Label>
              <Input
                id="dressSize"
                value={dressSize}
                onChange={(e) => setDressSize(e.target.value)}
                placeholder="S / 36"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hair">Hair</Label>
              <Input
                id="hair"
                value={hair}
                onChange={(e) => setHair(e.target.value)}
                placeholder="Brown"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eyes">Eyes</Label>
              <Input
                id="eyes"
                value={eyes}
                onChange={(e) => setEyes(e.target.value)}
                placeholder="Brown"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="skinTone">Skin tone</Label>
              <Input
                id="skinTone"
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                placeholder="Light / Medium"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="languages">Languages (comma-separated)</Label>
              <Input
                id="languages"
                value={languagesStr}
                onChange={(e) => setLanguagesStr(e.target.value)}
                placeholder="English, French, Italian"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="experience">Experience (comma-separated)</Label>
              <Input
                id="experience"
                value={experienceStr}
                onChange={(e) => setExperienceStr(e.target.value)}
                placeholder="Runway, Editorial, Campaign"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
