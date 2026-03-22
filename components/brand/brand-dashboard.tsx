"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { api, type AgencyRosterItem } from "@/lib/api-client"
import type { Casting, CastingApplication, CastingType, User } from "@/lib/types"
import {
  Plus,
  Briefcase,
  Users,
  MessageSquare,
  Settings,
  MapPin,
  Calendar,
  BadgeCheck,
  ChevronRight,
  Check,
  X,
  Star,
  Bell,
  UserCircle,
  Send,
  Loader2,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { SettingsView } from "@/components/settings/settings-view"
import { InboxView } from "@/components/model/inbox-view"

type BrandTab = "castings" | "submissions" | "messages" | "my-models" | "profile"

interface BrandDashboardProps {
  onViewCasting?: (casting: Casting) => void
  onViewProfile?: (user: User) => void
  onBack?: () => void
  bottomNav?: React.ReactNode
}

// --- API response → frontend type adapters ---

interface ApiCastingRow {
  id: string
  createdBy: string
  title: string
  type: string
  description: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  payMin: number | null
  payMax: number | null
  deadline: string | null
  status: string
  verifiedOnly: boolean
  requireDigitalTwin: boolean
  maxSubmissionsPerAgency: number | null
  createdAt: string
  creatorName: string
  creatorAvatar: string | null
  creatorUsername: string
  submissionsCount?: number
  shortlistedCount?: number
}

function apiCastingToFrontend(c: ApiCastingRow): Casting {
  return {
    id: c.id,
    creatorId: c.createdBy,
    creator: {
      id: c.createdBy,
      email: "",
      name: c.creatorName,
      username: c.creatorUsername,
      role: "brand",
      verified: false,
      verificationLevel: "unverified",
      avatar: c.creatorAvatar ?? "",
      bio: "",
      location: "",
      followers: 0,
      following: 0,
      createdAt: new Date(),
      companyName: c.creatorName,
    },
    title: c.title,
    type: c.type.toLowerCase() as CastingType,
    description: c.description ?? "",
    location: c.location ?? "TBD",
    dates: {
      start: c.startDate ? new Date(c.startDate) : new Date(),
      end: c.endDate ? new Date(c.endDate) : new Date(),
    },
    pay: {
      amount: c.payMin ?? 0,
      currency: "USD",
      type: c.payMin ? "flat" : "tbd",
    },
    requirements: {},
    deadline: c.deadline ? new Date(c.deadline) : new Date(),
    status: c.status.toLowerCase() as "active" | "draft" | "closed",
    applicationsCount: c.submissionsCount ?? 0,
    shortlistedCount: c.shortlistedCount ?? 0,
    createdAt: new Date(c.createdAt),
    images: [],
    settings: {
      verifiedOnly: c.verifiedOnly,
      maxSubmissionsPerAgency: c.maxSubmissionsPerAgency ?? 10,
      requireDigitalTwin: c.requireDigitalTwin,
    },
  }
}

interface ApiSubmissionRow {
  id: string
  castingId: string
  modelId: string
  status: string
  note: string | null
  createdAt: string
  updatedAt: string
  modelName: string
  modelAvatar: string | null
  modelUsername: string
  modelHeightCm: number | null
  modelScore: number
}

function apiSubmissionToFrontend(s: ApiSubmissionRow, casting?: Casting): CastingApplication {
  return {
    id: s.id,
    castingId: s.castingId,
    casting,
    modelId: s.modelId,
    model: {
      id: s.modelId,
      email: "",
      name: s.modelName,
      username: s.modelUsername,
      role: "model",
      verified: false,
      verificationLevel: "unverified",
      avatar: s.modelAvatar ?? "",
      bio: "",
      location: "",
      followers: 0,
      following: 0,
      createdAt: new Date(),
      measurements: s.modelHeightCm ? { height: `${s.modelHeightCm} cm` } : undefined,
    },
    status: s.status.toLowerCase() as CastingApplication["status"],
    message: s.note ?? undefined,
    submittedAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }
}

// --- Main Component ---

export function BrandDashboard({ onViewCasting, onViewProfile, onBack, bottomNav }: BrandDashboardProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<BrandTab>("castings")
  const [showCreateCasting, setShowCreateCasting] = useState(false)
  const [selectedCasting, setSelectedCasting] = useState<Casting | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // API-driven state
  const [myCastings, setMyCastings] = useState<Casting[]>([])
  const [platformCastings, setPlatformCastings] = useState<Casting[]>([])
  const [allSubmissions, setAllSubmissions] = useState<CastingApplication[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMyCastings = useCallback(async () => {
    if (!user) return
    const res = await api.getCastings({ creatorId: user.id })
    const data = res.data as { castings?: ApiCastingRow[] } | undefined
    if (data?.castings) {
      setMyCastings(data.castings.map(apiCastingToFrontend))
    }
  }, [user])

  const fetchPlatformCastings = useCallback(async () => {
    if (!user) return
    const res = await api.getCastings({ status: "active", limit: 5 })
    const data = res.data as { castings?: ApiCastingRow[] } | undefined
    if (data?.castings) {
      const rows = data.castings.filter((c) => c.createdBy !== user.id)
      setPlatformCastings(rows.map(apiCastingToFrontend))
    }
  }, [user])

  const fetchAllSubmissions = useCallback(async () => {
    if (!user || myCastings.length === 0) {
      setAllSubmissions([])
      return
    }
    const results = await Promise.all(
      myCastings.map(async (casting) => {
        const res = await api.getSubmissions(casting.id)
        const data = res.data as { submissions?: ApiSubmissionRow[] } | undefined
        if (data?.submissions) {
          return data.submissions.map((s) => apiSubmissionToFrontend(s, casting))
        }
        return []
      })
    )
    setAllSubmissions(results.flat())
  }, [user, myCastings])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchMyCastings(), fetchPlatformCastings()])
      setLoading(false)
    }
    init()
  }, [fetchMyCastings, fetchPlatformCastings])

  // Fetch submissions when switching to submissions tab or when castings load
  useEffect(() => {
    if (activeTab === "submissions" && myCastings.length > 0) {
      fetchAllSubmissions()
    }
  }, [activeTab, myCastings, fetchAllSubmissions])

  const totalSubmissions = myCastings.reduce((acc, c) => acc + c.applicationsCount, 0)
  const activeCastingsCount = myCastings.filter((c) => c.status === "active").length

  const handleCastingCreated = useCallback(async () => {
    await fetchMyCastings()
    setShowCreateCasting(false)
  }, [fetchMyCastings])

  const tabs: { id: BrandTab; label: string; icon: React.ReactNode }[] = [
    { id: "castings", label: "Castings", icon: <Briefcase className="w-5 h-5" /> },
    { id: "submissions", label: "Submissions", icon: <Users className="w-5 h-5" /> },
    ...(user?.role === "agency"
      ? [{ id: "my-models" as const, label: "My Models", icon: <UserCircle className="w-5 h-5" /> }]
      : []),
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <Settings className="w-5 h-5" /> },
  ]

  if (showSettings) {
    return <SettingsView onBack={() => setShowSettings(false)} />
  }

  if (selectedCasting) {
    return (
      <CastingSubmissions
        casting={selectedCasting}
        onBack={() => {
          setSelectedCasting(null)
          fetchMyCastings() // Refresh counts
        }}
        onViewProfile={onViewProfile}
      />
    )
  }

  const handleCastingClick = (casting: Casting) => {
    if (onViewCasting) {
      onViewCasting(casting)
    } else {
      setSelectedCasting(casting)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b border-border bg-background">
        <span className="text-lg font-semibold tracking-tight">LUXLANE</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-border">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-semibold">{myCastings.length}</div>
            <div className="text-xs text-muted-foreground">Castings</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-semibold">{totalSubmissions}</div>
            <div className="text-xs text-muted-foreground">
              {user?.role === "agency" ? "Submissions" : "Applications"}
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-semibold">{activeCastingsCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </Card>
        </div>
      </div>

      {/* Tab row */}
      <div className="flex border-b border-border sticky top-14 bg-background z-30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "castings" && (
          <motion.div key="castings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-4">
              <Button className="w-full h-12 mb-4" onClick={() => setShowCreateCasting(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Casting
              </Button>

              {loading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading castings…</span>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Castings</h3>
                    {myCastings.length > 0 ? (
                      <div className="space-y-3">
                        {myCastings.map((casting) => (
                          <CastingCard key={casting.id} casting={casting} onClick={() => handleCastingClick(casting)} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No castings yet</p>
                        <p className="text-sm">Create your first casting to find talent</p>
                      </div>
                    )}
                  </div>

                  {platformCastings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Active on Platform</h3>
                      <div className="space-y-3">
                        {platformCastings.map((casting) => (
                          <CastingCard
                            key={casting.id}
                            casting={casting}
                            onClick={() => handleCastingClick(casting)}
                            showCreator
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "submissions" && (
          <motion.div
            key="submissions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <AllSubmissionsView
              castings={myCastings}
              submissions={allSubmissions}
              onSelectCasting={setSelectedCasting}
              onViewProfile={onViewProfile}
            />
          </motion.div>
        )}

        {activeTab === "my-models" && user?.role === "agency" && (
          <motion.div
            key="my-models"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <AgencyMyModelsView onViewProfile={onViewProfile} />
          </motion.div>
        )}

        {activeTab === "messages" && (
          <motion.div
            key="messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <InboxView onViewProfile={onViewProfile} />
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <BrandProfileView />
          </motion.div>
        )}
      </AnimatePresence>

      <CreateCastingSheet open={showCreateCasting} onClose={() => setShowCreateCasting(false)} onCreated={handleCastingCreated} />

      {bottomNav}
    </div>
  )
}

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  HOLD: "On hold",
  BOOKED: "Booked",
}

function AgencyMyModelsView({ onViewProfile }: { onViewProfile?: (user: User) => void }) {
  const [roster, setRoster] = useState<AgencyRosterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manageModel, setManageModel] = useState<AgencyRosterItem | null>(null)
  const [proposeCastings, setProposeCastings] = useState<ApiCastingRow[]>([])
  const [loadingCastings, setLoadingCastings] = useState(false)
  const [proposingId, setProposingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [applications, setApplications] = useState<Array<{
    id: string; modelId: string; status: string; note: string | null;
    modelName: string; modelAvatar: string | null; modelUsername: string
  }>>([])
  const [showApplications, setShowApplications] = useState(false)

  const fetchRoster = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await api.getAgencyRoster()
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    if (res.data?.roster) setRoster(res.data.roster)
  }, [])

  useEffect(() => {
    fetchRoster()
  }, [fetchRoster])

  const handleModelClick = useCallback(
    (model: AgencyRosterItem) => {
      if (!onViewProfile) return
      const minimalUser: User = {
        id: model.id,
        username: model.username,
        name: model.displayName,
        email: model.email,
        role: "model",
        verified: model.verificationStatus !== "UNVERIFIED",
        verificationLevel:
          model.verificationStatus === "LUXLANE_VERIFIED"
            ? "luxlane_verified"
            : model.verificationStatus === "AGENCY_VERIFIED"
              ? "agency_verified"
              : "unverified",
        avatar: model.avatarUrl ?? "",
        bio: model.bio ?? "",
        location: model.location ?? "",
        followers: 0,
        following: 0,
        createdAt: new Date(),
      }
      onViewProfile(minimalUser)
    },
    [onViewProfile],
  )

  const openManageSheet = useCallback(async (model: AgencyRosterItem) => {
    setManageModel(model)
    setLoadingCastings(true)
    setProposeCastings([])
    const res = await api.getCastings({ status: "active", limit: 30 })
    setLoadingCastings(false)
    const castData = res.data as { castings?: ApiCastingRow[] } | undefined
    if (castData?.castings) {
      setProposeCastings(castData.castings)
    }
  }, [])

  const handlePropose = useCallback(async (castingId: string) => {
    if (!manageModel || proposingId) return
    setProposingId(castingId)
    await api.inviteModelToCasting(castingId, manageModel.id)
    setProposingId(null)
    setProposeCastings((prev) => prev.filter((c) => c.id !== castingId))
  }, [manageModel, proposingId])

  const handleRemoveModel = useCallback(async (modelId: string) => {
    setRemovingId(modelId)
    await api.removeModelFromAgency(modelId)
    setRemovingId(null)
    setManageModel(null)
    fetchRoster()
  }, [fetchRoster])

  const fetchApplications = useCallback(async () => {
    const res = await api.getAgencyApplications("PENDING")
    const data = res.data as { applications?: typeof applications } | undefined
    if (data?.applications) setApplications(data.applications)
  }, [])

  const handleRespondToApp = useCallback(async (appId: string, action: "accept" | "reject") => {
    await api.respondToAgencyApplication(appId, action)
    setApplications((prev) => prev.filter((a) => a.id !== appId))
    if (action === "accept") fetchRoster()
  }, [fetchRoster])

  useEffect(() => {
    if (showApplications) fetchApplications()
  }, [showApplications, fetchApplications])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="w-10 h-10 animate-pulse mb-3" />
        <p className="text-sm">Loading roster…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchRoster}>
          Retry
        </Button>
      </div>
    )
  }

  if (roster.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
        <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No models in your roster yet</p>
        <p className="text-sm mt-1">Models linked to your agency will appear here with their castings and availability.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Applications toggle */}
      <div className="flex items-center gap-2 px-4">
        <p className="text-sm text-muted-foreground flex-1">{roster.length} model{roster.length !== 1 ? "s" : ""} in your roster</p>
        <Button
          variant={showApplications ? "default" : "outline"}
          size="sm"
          onClick={() => setShowApplications(!showApplications)}
        >
          <Bell className="w-3.5 h-3.5 mr-1" />
          Applications
          {applications.length > 0 && (
            <span className="ml-1 bg-destructive text-destructive-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center">
              {applications.length}
            </span>
          )}
        </Button>
      </div>

      {/* Pending applications */}
      <AnimatePresence>
        {showApplications && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4"
          >
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending applications</p>
            ) : (
              <div className="space-y-2 py-2">
                {applications.map((app) => (
                  <Card key={app.id} className="p-3 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={app.modelAvatar ?? "/placeholder.svg"} />
                      <AvatarFallback>{app.modelName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{app.modelName}</p>
                      <p className="text-xs text-muted-foreground">@{app.modelUsername}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleRespondToApp(app.id, "accept")}>
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRespondToApp(app.id, "reject")}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 pb-4 pinterest-masonry">
        {roster.map((model) => (
          <Card
            key={model.id}
            className="overflow-hidden rounded-2xl border-0 bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div
              className="cursor-pointer"
              onClick={() => handleModelClick(model)}
            >
            <div className="aspect-[3/4] bg-muted relative flex items-center justify-center">
              <img
                src={model.avatarUrl ?? "/placeholder-user.jpg"}
                alt={model.displayName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] h-5 shadow-sm">
                  {AVAILABILITY_LABELS[model.availability] ?? model.availability}
                </Badge>
                {model.luxlaneScore > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 shadow-sm bg-background/90 backdrop-blur">
                    <Star className="w-3 h-3 mr-0.5" />
                    {model.luxlaneScore}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate flex-1">{model.displayName}</span>
                {model.verificationStatus !== "UNVERIFIED" && (
                  <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              {model.location && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{model.location}</span>
                </div>
              )}
              {model.submissions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Castings</p>
                  <ul className="space-y-1">
                    {model.submissions.slice(0, 3).map((s) => (
                      <li key={s.id} className="text-xs flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {s.casting && (
                          <>
                            <span className="font-medium truncate max-w-[120px]">{s.casting.title}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {s.status}
                            </Badge>
                          </>
                        )}
                      </li>
                    ))}
                    {model.submissions.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{model.submissions.length - 3} more</p>
                    )}
                  </ul>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  openManageSheet(model)
                }}
              >
                <Send className="w-3 h-3 mr-1.5" />
                Propose to event
              </Button>
            </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!manageModel} onOpenChange={(open) => !open && setManageModel(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {manageModel ? `Manage ${manageModel.displayName}` : "Manage Model"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {/* Remove from roster */}
            {manageModel && (
              <div className="px-2 mb-4">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={removingId === manageModel.id}
                  onClick={() => handleRemoveModel(manageModel.id)}
                >
                  {removingId === manageModel.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <X className="w-4 h-4 mr-1" />
                  )}
                  Remove from Roster
                </Button>
              </div>
            )}

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2">Propose to Event</p>
            {loadingCastings ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading castings…</span>
              </div>
            ) : proposeCastings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active castings to propose to.</p>
            ) : (
              <ul className="space-y-2 px-2">
                {proposeCastings.map((c) => (
                  <li key={c.id}>
                    <Card className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.creatorName ?? "Brand"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="shrink-0"
                        disabled={!!proposingId}
                        onClick={() => handlePropose(c.id)}
                      >
                        {proposingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Propose
                          </>
                        )}
                      </Button>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CastingCard({
  casting,
  onClick,
  showCreator = false,
}: {
  casting: Casting
  onClick: () => void
  showCreator?: boolean
}) {
  const typeLabels: Record<CastingType, string> = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{typeLabels[casting.type]}</Badge>
          <Badge variant={casting.status === "active" ? "default" : "outline"}>
            {casting.status === "active" ? "Active" : casting.status === "draft" ? "Draft" : "Closed"}
          </Badge>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">{casting.title}</h3>
      {showCreator && casting.creator && (
        <p className="text-sm text-muted-foreground mt-1">by {casting.creator.companyName || casting.creator.name}</p>
      )}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {casting.location}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(casting.dates.start, "MMM d")}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {casting.applicationsCount} applications
        </span>
        <span>{casting.shortlistedCount} shortlisted</span>
      </div>
    </Card>
  )
}

function AllSubmissionsView({
  castings,
  submissions,
  onSelectCasting,
  onViewProfile,
}: {
  castings: Casting[]
  submissions: CastingApplication[]
  onSelectCasting: (casting: Casting) => void
  onViewProfile?: (user: User) => void
}) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No submissions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {submissions.map((app) => (
        <Card
          key={app.id}
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            const casting = castings.find((c) => c.id === app.castingId)
            if (casting) onSelectCasting(casting)
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar
              className="w-12 h-12 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (onViewProfile) onViewProfile(app.model)
              }}
            >
              <AvatarImage src={app.model.avatar || "/placeholder.svg"} alt={app.model.name} />
              <AvatarFallback>{app.model.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{app.model.name}</span>
                {app.model.verified && <BadgeCheck className="w-4 h-4 shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground truncate">{app.casting?.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(app.submittedAt, { addSuffix: true })}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                app.status === "shortlisted"
                  ? "bg-warning/10 text-warning border-warning/20"
                  : app.status === "accepted"
                    ? "bg-success/10 text-success border-success/20"
                    : ""
              }
            >
              {app.status}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}

function CastingSubmissions({
  casting,
  onBack,
  onViewProfile,
}: {
  casting: Casting
  onBack: () => void
  onViewProfile?: (user: User) => void
}) {
  const [filter, setFilter] = useState<"all" | "applied" | "shortlisted" | "offered" | "accepted">("all")
  const [applications, setApplications] = useState<CastingApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    const res = await api.getSubmissions(casting.id)
    const subData = res.data as { submissions?: ApiSubmissionRow[] } | undefined
    if (subData?.submissions) {
      setApplications(subData.submissions.map((s) => apiSubmissionToFrontend(s, casting)))
    }
    setLoading(false)
  }, [casting])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const filteredApplications = applications.filter((a) => {
    if (filter === "all") return true
    return a.status === filter
  })

  const handleStatusUpdate = useCallback(async (submissionId: string, newStatus: string) => {
    await api.updateSubmissionStatus(submissionId, newStatus)
    fetchSubmissions()
  }, [fetchSubmissions])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    await api.bulkAction(casting.id, {
      action,
      submissionIds: Array.from(selectedIds),
    })
    setSelectedIds(new Set())
    setBulkLoading(false)
    fetchSubmissions()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <h1 className="ml-2 font-semibold truncate">{casting.title}</h1>
      </header>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
        {(["all", "applied", "shortlisted", "offered", "accepted"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="shrink-0"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">{applications.filter((a) => a.status === f).length}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Bulk action bar */}
      {filteredApplications.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-2 border-b border-border bg-muted/30">
          <Button variant="ghost" size="sm" className="text-xs" onClick={selectAll}>
            {selectedIds.size === filteredApplications.length ? "Deselect all" : "Select all"}
          </Button>
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <div className="ml-auto flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction("shortlist")}
                >
                  Shortlist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction("offer")}
                >
                  Offer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-500"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction("reject")}
                >
                  Reject
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading submissions…</span>
          </div>
        ) : filteredApplications.length > 0 ? (
          filteredApplications.map((app) => (
            <div key={app.id} className="flex items-start gap-2">
              <button
                className={`mt-3 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedIds.has(app.id) ? "bg-foreground border-foreground" : "border-muted-foreground/30"
                }`}
                onClick={() => toggleSelect(app.id)}
              >
                {selectedIds.has(app.id) && (
                  <svg className="w-3 h-3 text-background" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <ApplicationCard application={app} onViewProfile={onViewProfile} onStatusUpdate={handleStatusUpdate} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No {filter === "all" ? "" : filter} submissions</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({
  application,
  onViewProfile,
  onStatusUpdate,
}: {
  application: CastingApplication
  onViewProfile?: (user: User) => void
  onStatusUpdate: (submissionId: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const handleAction = async (status: string) => {
    setUpdating(true)
    await onStatusUpdate(application.id, status)
    setUpdating(false)
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <Avatar
            className="w-14 h-14 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              if (onViewProfile) onViewProfile(application.model)
            }}
          >
            <AvatarImage src={application.model.avatar || "/placeholder.svg"} alt={application.model.name} />
            <AvatarFallback>{application.model.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{application.model.name}</span>
              {application.model.verified && <BadgeCheck className="w-4 h-4 shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {application.model.measurements?.height} • {application.model.location}
            </p>
            <p className="text-xs text-muted-foreground">
              Applied {formatDistanceToNow(application.submittedAt, { addSuffix: true })}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              application.status === "shortlisted"
                ? "bg-warning/10 text-warning border-warning/20"
                : application.status === "accepted"
                  ? "bg-success/10 text-success border-success/20"
                  : application.status === "rejected"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : ""
            }
          >
            {application.status}
          </Badge>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border">
              {application.message && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm">{application.message}</p>
                </div>
              )}

              {application.portfolioSelection && application.portfolioSelection.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Portfolio</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {application.portfolioSelection.map((img, i) => (
                      <img
                        key={i}
                        src={img || "/placeholder.svg"}
                        alt={`Portfolio ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {(application.status === "applied" || application.status === "pending") && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={() => handleAction("SHORTLISTED")} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 mr-1" />}
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={() => handleAction("REJECTED")} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                    Decline
                  </Button>
                </div>
              )}

              {application.status === "shortlisted" && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAction("OFFERED")} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Send Offer
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={() => handleAction("REJECTED")} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function BrandProfileView() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
          <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-xl font-semibold">{user?.companyName || user?.name}</h2>
          {user?.verified && <BadgeCheck className="w-5 h-5" />}
        </div>
        <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
        <p className="text-sm text-muted-foreground mt-1">{user?.location}</p>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">About</h3>
        <p className="text-sm text-muted-foreground">{user?.bio || "No bio added yet."}</p>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Contact</h3>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">{user?.email}</p>
          {user?.website && (
            <a href={user.website} className="text-foreground underline">
              {user.website}
            </a>
          )}
        </div>
      </Card>
    </div>
  )
}

function CreateCastingSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<CastingType>("campaign")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [pay, setPay] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title || !user || submitting) return
    setSubmitting(true)

    const payAmount = Number.parseInt(pay) || 0
    const res = await api.createCasting({
      title,
      type: type.toUpperCase(),
      description: description || undefined,
      location: location || undefined,
      payMin: payAmount || undefined,
      payMax: payAmount || undefined,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })

    const createData = res.data as { casting?: { id: string } } | undefined
    if (createData?.casting) {
      await api.activateCasting(createData.casting.id)
    }

    setSubmitting(false)
    // Reset form
    setTitle("")
    setType("campaign")
    setDescription("")
    setLocation("")
    setPay("")
    onCreated()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Create New Casting</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto pb-20">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spring Campaign 2025"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CastingType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="runway">Runway</SelectItem>
                <SelectItem value="editorial">Editorial</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="fitting">Fitting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Paris, France"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="pay">Pay (USD)</Label>
            <Input
              id="pay"
              type="number"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              placeholder="e.g., 5000"
              className="mt-1"
            />
          </div>

          <Button className="w-full h-12" onClick={handleSubmit} disabled={!title || submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Casting"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
