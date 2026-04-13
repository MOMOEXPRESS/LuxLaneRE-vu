"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card } from "@/components/ui/card"
import type { Casting, User, CastingApplication, ModelMatch } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import { mockUsers, getUserLimits } from "@/lib/mock-data"
import { FitScorePanel } from "@/components/ai/fit-score-panel"
import { calculateFitScore } from "@/lib/ai-matching"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  BadgeCheck,
  Users,
  Check,
  ChevronRight,
  Shield,
  Scan,
  MessageSquare,
  AlertCircle,
  Bookmark,
  Share2,
  CheckSquare,
  Square,
  ListChecks,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { CastingAnalytics } from "@/components/analytics/casting-analytics"
import { format, formatDistanceToNow } from "date-fns"

interface CastingDetailProps {
  casting: Casting
  onBack: () => void
  onApply?: () => void
  onViewProfile?: (user: User) => void
  onViewCasting?: (casting: Casting) => void
  onOpenRoom?: () => void
}

export function CastingDetail({ casting, onBack, onApply, onViewProfile, onViewCasting, onOpenRoom }: CastingDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getActiveCastings, getApplicationsForModel, getApplicationsForCasting, addApplication, addNotification } =
    useStore()
  const [showApplySheet, setShowApplySheet] = useState(false)
  const [applyStep, setApplyStep] = useState(1)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [selectedPortfolio, setSelectedPortfolio] = useState<string[]>([])
  const [dbPortfolioImages, setDbPortfolioImages] = useState<string[]>([])
  const [showAiMatches, setShowAiMatches] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [aiMatchesFromApi, setAiMatchesFromApi] = useState<ModelMatch[]>([])
  const [aiMatchesLoading, setAiMatchesLoading] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const isModel = user?.role === "model"
  const isAgency = user?.role === "agency"
  const isBrand = user?.role === "brand"
  const isClient = user?.role === "client"
  const isCreator = casting.creatorId === user?.id

  const userApplications = user ? getApplicationsForModel(user.id) : []
  const existingApplication = userApplications.find((a) => a.castingId === casting.id)
  const hasApplied = submissionStatus !== null || !!existingApplication
  const appliedStatus = submissionStatus || existingApplication?.status

  const fetchSubmissionAndSaved = useCallback(async () => {
    if (!user) return
    const [subRes, savedRes] = await Promise.all([
      api.getCastingSubmission(casting.id),
      api.getCastingSaved(casting.id),
    ])
    const subData = subRes.data as { submission?: { status: string } } | undefined
    const savedData = savedRes.data as { saved?: boolean } | undefined
    if (subData?.submission) setSubmissionStatus(subData.submission.status)
    if (savedData?.saved !== undefined) setSaved(savedData.saved)
  }, [casting.id, user])

  useEffect(() => {
    fetchSubmissionAndSaved()
    // Track casting view
    api.trackCastingView(casting.id)
    // Poll for status updates every 30s (so model sees brand-side changes)
    const interval = setInterval(fetchSubmissionAndSaved, 30000)
    return () => clearInterval(interval)
  }, [fetchSubmissionAndSaved, casting.id])

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/castings/${casting.id}` : ""
    if (navigator.share) {
      navigator.share({ title: casting.title, url }).catch(() => {
        navigator.clipboard?.writeText(url)
      })
    } else {
      navigator.clipboard?.writeText(url)
    }
  }

  const handleBookmark = async () => {
    if (savedLoading || !user) return
    setSavedLoading(true)
    if (saved) {
      await api.unsaveCasting(casting.id)
      setSaved(false)
    } else {
      await api.saveCasting(casting.id)
      setSaved(true)
    }
    setSavedLoading(false)
  }

  const typeLabels: Record<string, string> = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  const aiMatches = isBrand || isAgency || isCreator ? aiMatchesFromApi : []

  const userLimits = user ? getUserLimits(user.id) : null
  const weeklyLimitReached = userLimits && userLimits.weeklyApplications >= userLimits.weeklyApplicationsMax

  const similarCastings = getActiveCastings()
    .filter((c) => c.id !== casting.id && c.type === casting.type)
    .slice(0, 3)

  const agencyRoster = isAgency && user?.roster ? mockUsers.filter((u) => user.roster?.includes(u.id)) : []

  const isVerifiedOnlyCasting = casting.settings?.verifiedOnly
  const requiresDigitalTwin = casting.settings?.requireDigitalTwin
  const canApply =
    !isVerifiedOnlyCasting ||
    user?.verificationLevel === "luxlane_verified" ||
    user?.verificationLevel === "agency_verified"
  const hasDigitalTwin = user?.digitalTwin?.status === "complete"
  const meetsDigitalTwinReq = !requiresDigitalTwin || hasDigitalTwin

  const [applyError, setApplyError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!user) return
    setApplyLoading(true)
    setApplyError(null)
    const res = await api.applyToCasting(casting.id, { note: applicationMessage })
    setApplyLoading(false)
    if (res.error) {
      if (res.error.includes("Already applied")) {
        setSubmissionStatus("applied")
        setShowApplySheet(false)
      } else {
        setApplyError(res.error)
      }
      return
    }
    setShowApplySheet(false)
    setSubmissionStatus("applied")
    const applyData = res.data as { submission?: { id: string } } | undefined
    addApplication({
      id: applyData?.submission?.id ?? `app-${Date.now()}`,
      castingId: casting.id,
      casting,
      modelId: user.id,
      model: user,
      status: "pending",
      message: applicationMessage,
      portfolioSelection: selectedPortfolio,
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    addNotification({
      id: `notif-${Date.now()}`,
      userId: casting.creatorId,
      type: "message",
      title: "New Application",
      message: `${user.name} has applied to ${casting.title}`,
      read: false,
      actionUrl: `/castings/${casting.id}`,
      metadata: { castingId: casting.id },
      createdAt: new Date(),
    })
    setShowApplySheet(false)
    setApplyStep(1)
    setApplicationMessage("")
    setSelectedPortfolio([])
  }

  // Application status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending": return { label: "Application Sent", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" }
      case "applied": return { label: "Application Sent", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" }
      case "under_review": return { label: "Under Review", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" }
      case "shortlisted": return { label: "Shortlisted", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20" }
      case "offered": return { label: "Offer Received", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" }
      case "accepted": return { label: "Accepted", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/20" }
      case "confirmed": return { label: "Booking Confirmed", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/20" }
      case "declined": return { label: "Declined", color: "text-zinc-400", bgColor: "bg-zinc-500/10 border-zinc-500/20" }
      case "rejected": return { label: "Not Selected", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" }
      default: return { label: status, color: "text-muted-foreground", bgColor: "bg-muted" }
    }
  }

  const [selectedModels, setSelectedModels] = useState<string[]>([])

  const handleAgencySubmit = () => {
    if (!user || selectedModels.length === 0) return

    selectedModels.forEach((modelId) => {
      const model = mockUsers.find((u) => u.id === modelId)
      if (!model) return

      const newApplication: CastingApplication = {
        id: `app-${Date.now()}-${modelId}`,
        castingId: casting.id,
        casting: casting,
        modelId: modelId,
        model: model,
        agencyId: user.id,
        status: "pending",
        message: `Submitted by ${user.companyName || user.name}`,
        submittedAt: new Date(),
        updatedAt: new Date(),
      }

      addApplication(newApplication)
    })

    // Notify casting creator
    addNotification({
      id: `notif-${Date.now()}`,
      userId: casting.creatorId,
      type: "message",
      title: "New Agency Submission",
      message: `${user.companyName || user.name} submitted ${selectedModels.length} models to ${casting.title}`,
      read: false,
      actionUrl: `/castings/${casting.id}`,
      metadata: { castingId: casting.id },
      createdAt: new Date(),
    })

    setShowApplySheet(false)
    setSelectedModels([])
  }

  const getActionButton = () => {
    if (isCreator) {
      const submissions = getApplicationsForCasting(casting.id)

      if (bulkSelectMode && selectedSubmissionIds.length > 0) {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              {selectedSubmissionIds.length} selected
            </Badge>
            <Button
              className="flex-1 h-12 bg-amber-600 hover:bg-amber-700"
              size="lg"
              disabled={bulkActionLoading}
              onClick={async () => {
                setBulkActionLoading(true)
                await api.bulkAction(casting.id, { action: "shortlist", submissionIds: selectedSubmissionIds })
                setBulkActionLoading(false)
                setSelectedSubmissionIds([])
                setBulkSelectMode(false)
              }}
            >
              Shortlist Selected
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10"
              size="lg"
              disabled={bulkActionLoading}
              onClick={async () => {
                setBulkActionLoading(true)
                await api.bulkAction(casting.id, { action: "reject", submissionIds: selectedSubmissionIds })
                setBulkActionLoading(false)
                setSelectedSubmissionIds([])
                setBulkSelectMode(false)
              }}
            >
              Reject Selected
            </Button>
          </div>
        )
      }

      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className={`h-12 ${bulkSelectMode ? "bg-white text-zinc-950" : "bg-transparent"}`}
            onClick={() => {
              setBulkSelectMode((v) => !v)
              setSelectedSubmissionIds([])
            }}
          >
            <ListChecks className="w-4 h-4 mr-1" />
            Select
          </Button>
          <Button className="flex-1 h-12" size="lg">
            Review Submissions
            <Badge variant="secondary" className="ml-2">
              {submissions.length}
            </Badge>
          </Button>
          {onOpenRoom && (
            <Button variant="outline" size="lg" className="h-12 bg-transparent" onClick={onOpenRoom}>
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }

    if (isModel) {
      if (hasApplied) {
        const statusInfo = getStatusDisplay(appliedStatus || "applied")
        const statusMessage = (() => {
          switch (appliedStatus) {
            case "pending": case "applied": return "The casting director will review your application."
            case "shortlisted": return "You've been shortlisted! Stay tuned for next steps."
            case "offered": return "You've received an offer! Check Inbox → Bookings to respond."
            case "accepted": return "You accepted the offer. Awaiting brand confirmation."
            case "confirmed": return "Your booking is confirmed! Enter the casting room to coordinate."
            case "declined": return "You declined this offer."
            case "rejected": return "This casting wasn't a match. Keep applying!"
            default: return "Your application is being processed."
          }
        })()

        return (
          <div className="space-y-2">
            <Card className={`p-4 border ${statusInfo.bgColor}`}>
              <div className="flex items-center gap-3">
                <Check className={`w-5 h-5 ${statusInfo.color}`} />
                <div className="flex-1">
                  <p className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{statusMessage}</p>
                </div>
              </div>
            </Card>
            {/* Enter Casting Room button for confirmed bookings */}
            {appliedStatus === "confirmed" && onOpenRoom && (
              <Button className="w-full h-12" size="lg" onClick={onOpenRoom}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Enter Casting Room
              </Button>
            )}
          </div>
        )
      }

      if (!canApply) {
        return (
          <div className="space-y-2">
            <Button className="w-full h-12" size="lg" disabled>
              <Shield className="w-4 h-4 mr-2" />
              Verified Models Only
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              This casting requires verification. Get verified in Settings.
            </p>
          </div>
        )
      }

      if (!meetsDigitalTwinReq) {
        return (
          <div className="space-y-2">
            <Button className="w-full h-12" size="lg" disabled>
              <Scan className="w-4 h-4 mr-2" />
              Digital Twin Required
            </Button>
            <p className="text-xs text-center text-muted-foreground">Create your Digital Twin in Settings to apply.</p>
          </div>
        )
      }

      if (weeklyLimitReached) {
        return (
          <div className="space-y-2">
            <Button className="w-full h-12" size="lg" disabled>
              <AlertCircle className="w-4 h-4 mr-2" />
              Weekly Limit Reached
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You've reached your {userLimits?.weeklyApplicationsMax} applications this week.
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <Button
            className="w-full h-12"
            size="lg"
            onClick={() => setShowApplySheet(true)}
            disabled={casting.status !== "active" || applyLoading}
          >
            {applyLoading ? "Applying…" : "Apply Now"}
          </Button>
          {userLimits && (
            <p className="text-xs text-center text-muted-foreground">
              {userLimits.weeklyApplicationsMax - userLimits.weeklyApplications} applications remaining this week
            </p>
          )}
        </div>
      )
    }

    if (isAgency) {
      return (
        <Button className="w-full h-12" size="lg" onClick={() => setShowApplySheet(true)}>
          Submit Models
        </Button>
      )
    }

    if (isBrand || isClient) {
      return (
        <Button variant="outline" className="w-full h-12 bg-transparent" size="lg">
          Request Info
        </Button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image */}
      {casting.images?.[0] && (
        <div className="relative h-56 bg-muted">
          <img
            src={casting.images[0] || "/placeholder.svg"}
            alt={casting.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`bg-background/80 backdrop-blur-sm ${saved ? "text-foreground" : ""}`}
                onClick={handleBookmark}
                disabled={savedLoading}
              >
                <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 backdrop-blur-sm"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {!casting.images?.[0] && (
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className={saved ? "text-foreground" : ""} onClick={handleBookmark} disabled={savedLoading}>
              <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* Title & Creator */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary">{typeLabels[casting.type]}</Badge>
            <Badge variant="outline">{casting.status === "active" ? "Active" : "Closed"}</Badge>
            {isVerifiedOnlyCasting && (
              <Badge className="bg-emerald-500/10 text-emerald-600">
                <Shield className="w-3 h-3 mr-0.5" />
                Verified Only
              </Badge>
            )}
            {requiresDigitalTwin && (
              <Badge className="bg-violet-500/10 text-violet-600">
                <Scan className="w-3 h-3 mr-0.5" />
                Twin Required
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{casting.title}</h1>
          <button className="flex items-center gap-2 mt-3" onClick={() => onViewProfile?.(casting.creator)}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={casting.creator.avatar || "/placeholder.svg"} alt={casting.creator.name} />
              <AvatarFallback>{casting.creator.name[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{casting.creator.name}</span>
            {casting.creator.verified && <BadgeCheck className="w-4 h-4" />}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {isModel && user && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Your fit</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const fit = calculateFitScore(user, casting)
                  return `${fit.total}%`
                })()}
              </p>
            </div>
          )}
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-sm">{casting.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dates</p>
              <p className="font-medium text-sm">
                {format(casting.dates.start, "MMM d")} - {format(casting.dates.end, "MMM d")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="font-medium text-sm">
                {casting.pay.type === "tbd" ? "TBD" : `${casting.pay.amount.toLocaleString()} ${casting.pay.currency}`}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium text-sm">{formatDistanceToNow(casting.deadline, { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">About this casting</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{casting.description}</p>
        </div>

        {/* Requirements */}
        <div>
          <h3 className="font-semibold mb-2">Requirements</h3>
          <div className="space-y-2 text-sm">
            {casting.requirements.gender && casting.requirements.gender !== "any" && (
              <p>
                <span className="text-muted-foreground">Gender:</span>{" "}
                <span className="capitalize">{casting.requirements.gender}</span>
              </p>
            )}
            {casting.requirements.heightRange && (
              <p>
                <span className="text-muted-foreground">Height:</span> {casting.requirements.heightRange.min} -{" "}
                {casting.requirements.heightRange.max}
              </p>
            )}
            {casting.requirements.ageRange && (
              <p>
                <span className="text-muted-foreground">Age:</span> {casting.requirements.ageRange.min} -{" "}
                {casting.requirements.ageRange.max} years
              </p>
            )}
            {casting.requirements.experience && casting.requirements.experience.length > 0 && (
              <div>
                <span className="text-muted-foreground">Experience:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {casting.requirements.experience.map((exp) => (
                    <Badge key={exp} variant="secondary" className="capitalize">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {casting.requirements.look && casting.requirements.look.length > 0 && (
              <div>
                <span className="text-muted-foreground">Look:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {casting.requirements.look.map((look) => (
                    <Badge key={look} variant="secondary" className="capitalize">
                      {look}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {casting.requirements.other && <p className="text-muted-foreground">{casting.requirements.other}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {casting.applicationsCount} applications
          </span>
          <span>{casting.shortlistedCount} shortlisted</span>
        </div>

        {/* Submissions list with bulk select (creator only) */}
        {isCreator && (() => {
          const submissions = getApplicationsForCasting(casting.id)
          if (submissions.length === 0) return null
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Submissions</h3>
                {bulkSelectMode && submissions.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      if (selectedSubmissionIds.length === submissions.length) {
                        setSelectedSubmissionIds([])
                      } else {
                        setSelectedSubmissionIds(submissions.map((s) => s.id))
                      }
                    }}
                  >
                    {selectedSubmissionIds.length === submissions.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {submissions.map((submission) => {
                  const isSelected = selectedSubmissionIds.includes(submission.id)
                  return (
                    <Card
                      key={submission.id}
                      className={`p-3 flex items-center gap-3 transition-colors ${
                        bulkSelectMode ? "cursor-pointer" : ""
                      } ${isSelected ? "bg-muted border-foreground" : ""}`}
                      onClick={() => {
                        if (!bulkSelectMode) return
                        if (isSelected) {
                          setSelectedSubmissionIds((prev) => prev.filter((id) => id !== submission.id))
                        } else {
                          setSelectedSubmissionIds((prev) => [...prev, submission.id])
                        }
                      }}
                    >
                      {bulkSelectMode && (
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-foreground" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={submission.model?.avatar || "/placeholder.svg"} alt={submission.model?.name || "Model"} />
                        <AvatarFallback>{submission.model?.name?.[0] || "M"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{submission.model?.name || "Unknown"}</p>
                        {submission.message && (
                          <p className="text-xs text-muted-foreground truncate">{submission.message}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 capitalize text-xs ${
                          submission.status === "shortlisted"
                            ? "bg-amber-500/10 text-amber-600"
                            : submission.status === "accepted" || submission.status === "offered"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : submission.status === "rejected"
                                ? "bg-red-500/10 text-red-600"
                                : ""
                        }`}
                      >
                        {submission.status}
                      </Badge>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {(isBrand || isAgency || isCreator) && aiMatchesLoading && (
          <p className="text-sm text-muted-foreground py-4">Loading AI matches…</p>
        )}
        {(isBrand || isAgency || isCreator) && !aiMatchesLoading && aiMatches.length > 0 && (
          <FitScorePanel
            matches={aiMatches}
            onViewProfile={(u) => onViewProfile?.(u)}
            onInvite={async (u) => {
              if (invitingId || !u?.id) return
              setInvitingId(u.id)
              const res = await api.inviteModelToCasting(casting.id, u.id)
              setInvitingId(null)
              if (res.error) return
              setAiMatchesFromApi((prev) => prev.filter((m) => m.model.id !== u.id))
            }}
            title="AI Top Matches"
          />
        )}

        {/* Casting Analytics — Creator only */}
        {isCreator && (
          <CastingAnalytics castingId={casting.id} />
        )}

        {/* Similar Castings */}
        {similarCastings.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Similar Castings</h3>
            <div className="space-y-2">
              {similarCastings.map((c) => (
                <Card
                  key={c.id}
                  className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onViewCasting?.(c)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={c.creator.avatar || "/placeholder.svg"} alt={c.creator.name} />
                      <AvatarFallback>{c.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.creator.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Bar — sits above bottom nav */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-background border-t border-border z-40">{getActionButton()}</div>

      {/* Apply Sheet - Model */}
      {isModel && (
        <Sheet open={showApplySheet} onOpenChange={(open) => {
          setShowApplySheet(open)
          if (open && user) {
            api.getMedia(user.id, "PORTFOLIO").then((res) => {
              const data = res.data as { media?: Array<{ url: string }> } | undefined
              if (data?.media) setDbPortfolioImages(data.media.map((m) => m.url))
            })
          }
        }}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {applyStep === 1 && "Review Your Profile"}
                {applyStep === 2 && "Select Portfolio"}
                {applyStep === 3 && "Confirm Availability"}
                {applyStep === 4 && "Submit Application"}
              </SheetTitle>
            </SheetHeader>

            {/* Step indicators */}
            <div className="flex gap-1 mt-4 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= applyStep ? "bg-foreground" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-6">
              {/* Step 1: Profile Review */}
              {applyStep === 1 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    This info will be sent with your application. Make sure it's up to date.
                  </p>

                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-sm text-muted-foreground">@{user?.username}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Location</p>
                        <p className="text-sm font-medium">{user?.location || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Height</p>
                        <p className="text-sm font-medium">{user?.measurements?.height || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hair</p>
                        <p className="text-sm font-medium">{user?.measurements?.hairColor || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Eyes</p>
                        <p className="text-sm font-medium">{user?.measurements?.eyeColor || "Not set"}</p>
                      </div>
                    </div>

                    {user?.bio && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bio</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{user.bio}</p>
                      </div>
                    )}
                  </Card>

                  {/* Casting requirements check */}
                  <Card className="p-4">
                    <h4 className="font-medium text-sm mb-3">Requirements Check</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {user?.verified ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={user?.verified ? "" : "text-muted-foreground"}>Verified profile</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {(dbPortfolioImages.length > 0 || (user?.portfolio?.length ?? 0) > 0) ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Portfolio ({dbPortfolioImages.length || user?.portfolio?.length || 0} photos)</span>
                      </div>
                      {requiresDigitalTwin && (
                        <div className="flex items-center gap-2 text-sm">
                          {meetsDigitalTwinReq ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={meetsDigitalTwinReq ? "" : "text-red-400"}>Digital Twin required</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Button className="w-full" onClick={() => setApplyStep(2)}>
                    Continue
                  </Button>
                </>
              )}

              {/* Step 2: Portfolio Selection */}
              {applyStep === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select photos to include with your application ({selectedPortfolio.length} selected)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(dbPortfolioImages.length > 0 ? dbPortfolioImages : user?.portfolio || []).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (selectedPortfolio.includes(img)) {
                            setSelectedPortfolio((prev) => prev.filter((p) => p !== img))
                          } else {
                            setSelectedPortfolio((prev) => [...prev, img])
                          }
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors relative ${
                          selectedPortfolio.includes(img) ? "border-foreground" : "border-transparent"
                        }`}
                      >
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Portfolio ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedPortfolio.includes(img) && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-background" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {dbPortfolioImages.length === 0 && (user?.portfolio || []).length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No portfolio photos yet. You can skip this step.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setApplyStep(1)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setApplyStep(3)}>
                      Continue
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Availability */}
              {applyStep === 3 && (
                <>
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Casting Schedule</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(casting.dates.start, "MMM d")} – {format(casting.dates.end, "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">{casting.location}</p>
                      </div>
                    </div>
                    {casting.pay && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            €{casting.pay.amount}/{casting.pay.type}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>

                  <p className="text-sm text-muted-foreground">
                    By continuing, you confirm you are available for these dates and location.
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setApplyStep(2)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setApplyStep(4)}>
                      I'm Available
                    </Button>
                  </div>
                </>
              )}

              {/* Step 4: Note + Submit */}
              {applyStep === 4 && (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Cover Note</h4>
                    <Textarea
                      placeholder="Tell the casting director why you're perfect for this role..."
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Optional but recommended</p>
                  </div>

                  {/* Application summary */}
                  <Card className="p-4">
                    <h4 className="font-medium text-sm mb-2">Application Summary</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>📋 Profile info included</p>
                      <p>🖼 {selectedPortfolio.length} portfolio photo{selectedPortfolio.length !== 1 ? "s" : ""}</p>
                      <p>📅 Availability confirmed</p>
                      {applicationMessage.trim() && <p>💬 Cover note included</p>}
                    </div>
                  </Card>

                  {applyError && (
                    <p className="text-sm text-red-500 text-center">{applyError}</p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setApplyStep(3)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handleApply} disabled={applyLoading}>
                      {applyLoading ? "Submitting…" : "Submit Application"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Submit Sheet - Agency */}
      {isAgency && (
        <Sheet open={showApplySheet} onOpenChange={setShowApplySheet}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Submit Models to {casting.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select models from your roster to submit. Max {casting.settings?.maxSubmissionsPerAgency || 5} per
                casting.
              </p>
              {agencyRoster.length > 0 ? (
                <div className="space-y-2">
                  {agencyRoster.map((model) => {
                    const isSelected = selectedModels.includes(model.id)
                    return (
                      <Card
                        key={model.id}
                        className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "bg-muted border-foreground" : ""}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedModels((prev) => prev.filter((id) => id !== model.id))
                          } else if (selectedModels.length < (casting.settings?.maxSubmissionsPerAgency || 5)) {
                            setSelectedModels((prev) => [...prev, model.id])
                          }
                        }}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
                          <AvatarFallback>{model.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.name}</span>
                            {model.verified && <BadgeCheck className="w-4 h-4" />}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {model.measurements?.height} • {model.location}
                          </p>
                        </div>
                        {isSelected && <Check className="w-5 h-5" />}
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No models in your roster</p>
              )}

              {selectedModels.length > 0 && (
                <Button className="w-full h-12" onClick={handleAgencySubmit}>
                  Submit {selectedModels.length} Model{selectedModels.length > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
