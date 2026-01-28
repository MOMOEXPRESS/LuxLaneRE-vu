"use client"

import type React from "react"

import { useState } from "react"
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
import { useStore } from "@/lib/store-context"
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
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { SettingsView } from "@/components/settings/settings-view"

type BrandTab = "castings" | "submissions" | "messages" | "profile"

interface BrandDashboardProps {
  onViewCasting?: (casting: Casting) => void
  onViewProfile?: (user: User) => void
  onBack?: () => void
  bottomNav?: React.ReactNode
}

export function BrandDashboard({ onViewCasting, onViewProfile, onBack, bottomNav }: BrandDashboardProps) {
  const { user } = useAuth()
  const { getCastingsForCreator, getApplicationsForCasting, addCasting, getActiveCastings } = useStore()
  const [activeTab, setActiveTab] = useState<BrandTab>("castings")
  const [showCreateCasting, setShowCreateCasting] = useState(false)
  const [selectedCasting, setSelectedCasting] = useState<Casting | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const myCastings = user ? getCastingsForCreator(user.id) : []
  const totalSubmissions = myCastings.reduce((acc, c) => {
    const apps = getApplicationsForCasting(c.id)
    return acc + apps.length
  }, 0)
  const activeCastingsCount = myCastings.filter((c) => c.status === "active").length

  const globalActiveCastings = getActiveCastings()
    .filter((c) => c.creatorId !== user?.id)
    .slice(0, 5)

  const tabs: { id: BrandTab; label: string; icon: React.ReactNode }[] = [
    { id: "castings", label: "Castings", icon: <Briefcase className="w-5 h-5" /> },
    { id: "submissions", label: "Submissions", icon: <Users className="w-5 h-5" /> },
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
        onBack={() => setSelectedCasting(null)}
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

      {/* Quick Stats - 3 stat cards row */}
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

      {/* Internal tab row */}
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
              {/* Create New Casting button */}
              <Button className="w-full h-12 mb-4" onClick={() => setShowCreateCasting(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Casting
              </Button>

              {/* Your Castings section */}
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

              {globalActiveCastings.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Active on Platform</h3>
                  <div className="space-y-3">
                    {globalActiveCastings.map((casting) => (
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
              onSelectCasting={setSelectedCasting}
              onViewProfile={onViewProfile}
            />
          </motion.div>
        )}

        {activeTab === "messages" && (
          <motion.div
            key="messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 text-center py-12 text-muted-foreground"
          >
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Messages coming soon</p>
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

      {/* Create Casting Sheet */}
      <CreateCastingSheet open={showCreateCasting} onClose={() => setShowCreateCasting(false)} onAdd={addCasting} />

      {bottomNav}
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
  onSelectCasting,
  onViewProfile,
}: {
  castings: Casting[]
  onSelectCasting: (casting: Casting) => void
  onViewProfile?: (user: User) => void
}) {
  const { getApplicationsForCasting } = useStore()
  const allApplications = castings.flatMap((c) => getApplicationsForCasting(c.id))

  if (allApplications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No submissions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {allApplications.map((app) => (
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
  const [filter, setFilter] = useState<"all" | "pending" | "shortlisted" | "accepted">("all")
  const { getApplicationsForCasting } = useStore()
  const applications = getApplicationsForCasting(casting.id)

  const filteredApplications = applications.filter((a) => {
    if (filter === "all") return true
    return a.status === filter
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <h1 className="ml-2 font-semibold truncate">{casting.title}</h1>
      </header>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
        {(["all", "pending", "shortlisted", "accepted"] as const).map((f) => (
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

      {/* Applications */}
      <div className="p-4 space-y-3">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} onViewProfile={onViewProfile} />
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
}: {
  application: CastingApplication
  onViewProfile?: (user: User) => void
}) {
  const { updateApplication } = useStore()
  const [expanded, setExpanded] = useState(false)

  const handleShortlist = () => {
    updateApplication(application.id, { status: "shortlisted", updatedAt: new Date() })
  }

  const handleAccept = () => {
    updateApplication(application.id, { status: "accepted", updatedAt: new Date() })
  }

  const handleReject = () => {
    updateApplication(application.id, { status: "rejected", updatedAt: new Date() })
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

              {application.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleShortlist}>
                    <Star className="w-4 h-4 mr-1" />
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleReject}>
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}

              {application.status === "shortlisted" && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleAccept}>
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleReject}>
                    <X className="w-4 h-4 mr-1" />
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
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (casting: Casting) => void
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<CastingType>("campaign")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [pay, setPay] = useState("")

  const handleSubmit = () => {
    if (!title || !user) return

    const newCasting: Casting = {
      id: `c${Date.now()}`,
      creatorId: user.id,
      creator: user,
      title,
      type,
      description,
      location: location || "TBD",
      dates: {
        start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
      },
      pay: {
        amount: Number.parseInt(pay) || 0,
        currency: "USD",
        type: pay ? "flat" : "tbd",
      },
      requirements: {},
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "active",
      applicationsCount: 0,
      shortlistedCount: 0,
      createdAt: new Date(),
      images: [],
      settings: {
        verifiedOnly: false,
        maxSubmissionsPerAgency: 10,
        requireDigitalTwin: false,
      },
    }

    onAdd(newCasting)
    onClose()
    // Reset form
    setTitle("")
    setType("campaign")
    setDescription("")
    setLocation("")
    setPay("")
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

          <Button className="w-full h-12" onClick={handleSubmit} disabled={!title}>
            Create Casting
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
