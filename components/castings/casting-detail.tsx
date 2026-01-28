"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card } from "@/components/ui/card"
import type { Casting, User, CastingApplication } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import { mockUsers, getUserLimits } from "@/lib/mock-data"
import { getTopMatchesForCasting } from "@/lib/ai-matching"
import { FitScorePanel } from "@/components/ai/fit-score-panel"
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
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface CastingDetailProps {
  casting: Casting
  onBack: () => void
  onApply?: () => void
  onViewProfile?: (user: User) => void
  onOpenRoom?: () => void
}

export function CastingDetail({ casting, onBack, onApply, onViewProfile, onOpenRoom }: CastingDetailProps) {
  const { user } = useAuth()
  const { getActiveCastings, getApplicationsForModel, getApplicationsForCasting, addApplication, addNotification } =
    useStore()
  const [showApplySheet, setShowApplySheet] = useState(false)
  const [applyStep, setApplyStep] = useState(1)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [selectedPortfolio, setSelectedPortfolio] = useState<string[]>([])
  const [showAiMatches, setShowAiMatches] = useState(false)

  const isModel = user?.role === "model"
  const isAgency = user?.role === "agency"
  const isBrand = user?.role === "brand"
  const isClient = user?.role === "client"
  const isCreator = casting.creatorId === user?.id

  const userApplications = user ? getApplicationsForModel(user.id) : []
  const existingApplication = userApplications.find((a) => a.castingId === casting.id)
  const hasApplied = !!existingApplication

  const typeLabels: Record<string, string> = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  const aiMatches = isBrand || isAgency || isCreator ? getTopMatchesForCasting(casting, 5) : []

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

  const handleApply = () => {
    if (!user) return

    const newApplication: CastingApplication = {
      id: `app-${Date.now()}`,
      castingId: casting.id,
      casting: casting,
      modelId: user.id,
      model: user,
      status: "pending",
      message: applicationMessage,
      portfolioSelection: selectedPortfolio,
      submittedAt: new Date(),
      updatedAt: new Date(),
    }

    addApplication(newApplication)

    // Create notification for casting creator
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
      return (
        <div className="flex gap-2">
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
        return (
          <div className="space-y-2">
            <Button className="w-full h-12" size="lg" disabled>
              <Check className="w-4 h-4 mr-2" />
              Applied
              {existingApplication && (
                <Badge
                  variant="outline"
                  className={`ml-2 ${
                    existingApplication.status === "shortlisted"
                      ? "bg-warning/10 text-warning"
                      : existingApplication.status === "accepted"
                        ? "bg-success/10 text-success"
                        : ""
                  }`}
                >
                  {existingApplication.status}
                </Badge>
              )}
            </Button>
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
            disabled={casting.status !== "active"}
          >
            Apply Now
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
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      {!casting.images?.[0] && (
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
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

        {(isBrand || isAgency || isCreator) && aiMatches.length > 0 && (
          <FitScorePanel
            matches={aiMatches}
            onViewProfile={(u) => onViewProfile?.(u)}
            onInvite={(u) => {
              // Mock invite action
            }}
            title="AI Top Matches"
          />
        )}

        {/* Similar Castings */}
        {similarCastings.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Similar Castings</h3>
            <div className="space-y-2">
              {similarCastings.map((c) => (
                <Card key={c.id} className="p-3 cursor-pointer hover:bg-muted/30 transition-colors">
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

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">{getActionButton()}</div>

      {/* Apply Sheet - Model */}
      {isModel && (
        <Sheet open={showApplySheet} onOpenChange={setShowApplySheet}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Apply to {casting.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {applyStep === 1 && (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Select Portfolio Images</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(user?.portfolio || []).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (selectedPortfolio.includes(img)) {
                              setSelectedPortfolio((prev) => prev.filter((p) => p !== img))
                            } else {
                              setSelectedPortfolio((prev) => [...prev, img])
                            }
                          }}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedPortfolio.includes(img) ? "border-foreground" : "border-transparent"
                          }`}
                        >
                          <img
                            src={img || "/placeholder.svg"}
                            alt={`Portfolio ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setApplyStep(2)}>
                    Continue
                  </Button>
                </>
              )}

              {applyStep === 2 && (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Confirm Availability</h4>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(casting.dates.start, "MMM d")} - {format(casting.dates.end, "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">{casting.location}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setApplyStep(1)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setApplyStep(3)}>
                      I'm Available
                    </Button>
                  </div>
                </>
              )}

              {applyStep === 3 && (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Add a Note (Optional)</h4>
                    <Textarea
                      placeholder="Tell the casting director why you're perfect for this..."
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setApplyStep(2)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handleApply}>
                      Submit Application
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
