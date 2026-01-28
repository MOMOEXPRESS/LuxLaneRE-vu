"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Casting } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, BadgeCheck, Users, Check } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface CastingDetailProps {
  casting: Casting
  onBack: () => void
}

export function CastingDetail({ casting, onBack }: CastingDetailProps) {
  const { user } = useAuth()
  const [showApplySheet, setShowApplySheet] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [hasApplied, setHasApplied] = useState(false)

  const typeLabels = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  const handleApply = () => {
    setHasApplied(true)
    setShowApplySheet(false)
  }

  return (
    <div className="pb-24">
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
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{typeLabels[casting.type]}</Badge>
            <Badge variant="outline">{casting.status === "active" ? "Active" : "Closed"}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{casting.title}</h1>
          <button className="flex items-center gap-2 mt-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={casting.creator.avatar || "/placeholder.svg"} alt={casting.creator.name} />
              <AvatarFallback>{casting.creator.name[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{casting.creator.name}</span>
            {casting.creator.verified && <BadgeCheck className="w-4 h-4" />}
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
      </div>

      {/* Apply Button - Fixed */}
      {user?.role === "model" && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
          <Button className="w-full h-12" size="lg" onClick={() => setShowApplySheet(true)} disabled={hasApplied}>
            {hasApplied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Applied
              </>
            ) : (
              "Apply Now"
            )}
          </Button>
        </div>
      )}

      {/* Apply Sheet */}
      <Sheet open={showApplySheet} onOpenChange={setShowApplySheet}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="text-left">
            <SheetTitle>Apply for {casting.title}</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message (optional)</label>
              <Textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Tell them why you're a great fit..."
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your profile, portfolio, and comp card will be shared with the casting creator.
            </p>
            <Button className="w-full h-12" onClick={handleApply}>
              Submit Application
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
