"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { mockJobOffers, mockConversations, getApplicationsForModel } from "@/lib/mock-data"
import { useStore } from "@/lib/store-context"
import { useAuth } from "@/lib/auth-context"
import type { Casting, JobOffer, CastingApplication } from "@/lib/types"
import { MapPin, Calendar, DollarSign, ArrowRight, CheckCircle2, Clock, Sparkles, BadgeCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface HomeFeedProps {
  onViewCasting: (casting: Casting) => void
  onViewOffer: (offer: JobOffer) => void
}

export function HomeFeed({ onViewCasting, onViewOffer }: HomeFeedProps) {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState<"all" | "castings" | "offers" | "updates">("all")
  const { castings } = useStore()

  const applications = user ? getApplicationsForModel(user.id) : []
  const offers = user ? mockJobOffers.filter((o) => o.modelId === user.id) : []
  const unreadMessages = mockConversations.reduce((acc, c) => acc + c.unreadCount, 0)

  const filters = [
    { id: "all", label: "All" },
    { id: "castings", label: "Castings" },
    { id: "offers", label: "Offers" },
    { id: "updates", label: "Updates" },
  ] as const

  return (
    <div className="pb-20">
      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-border">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-semibold">{applications.length}</div>
            <div className="text-xs text-muted-foreground">Applications</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-semibold">{offers.length}</div>
            <div className="text-xs text-muted-foreground">Offers</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-semibold">{unreadMessages}</div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className="shrink-0"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Pending Offers Section */}
      {(activeFilter === "all" || activeFilter === "offers") && offers.length > 0 && (
        <section className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-warning" />
            <h2 className="font-semibold">Pending Offers</h2>
          </div>
          <div className="space-y-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onView={() => onViewOffer(offer)} />
            ))}
          </div>
        </section>
      )}

      {/* Your Applications */}
      {(activeFilter === "all" || activeFilter === "castings") && applications.length > 0 && (
        <section className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Your Applications</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {applications.slice(0, 3).map((app) => (
              <ApplicationCard key={app.id} application={app} onView={() => onViewCasting(app.casting)} />
            ))}
          </div>
        </section>
      )}

      {/* Open Castings */}
      {(activeFilter === "all" || activeFilter === "castings") && (
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Open Castings</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              See All
            </Button>
          </div>
          <div className="space-y-3">
            {castings
              .filter((c) => c.status === "active")
              .slice(0, 5)
              .map((casting, index) => (
                <motion.div
                  key={casting.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CastingCard casting={casting} onView={() => onViewCasting(casting)} />
                </motion.div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

function OfferCard({ offer, onView }: { offer: JobOffer; onView: () => void }) {
  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onView}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={offer.sender.avatar || "/placeholder.svg"} alt={offer.sender.name} />
          <AvatarFallback>{offer.sender.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{offer.sender.name}</span>
            {offer.sender.verified && <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />}
          </div>
          <p className="font-medium text-sm mt-1">{offer.title}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {offer.pay.amount.toLocaleString()} {offer.pay.currency}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {offer.location}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 bg-warning/10 text-warning border-warning/20">
          Pending
        </Badge>
      </div>
    </Card>
  )
}

function ApplicationCard({
  application,
  onView,
}: {
  application: CastingApplication
  onView: () => void
}) {
  const statusConfig = {
    pending: { label: "Pending", icon: Clock, color: "text-muted-foreground" },
    shortlisted: { label: "Shortlisted", icon: Sparkles, color: "text-warning" },
    accepted: { label: "Accepted", icon: CheckCircle2, color: "text-success" },
    rejected: { label: "Not Selected", icon: null, color: "text-destructive" },
    withdrawn: { label: "Withdrawn", icon: null, color: "text-muted-foreground" },
  }

  const status = statusConfig[application.status]
  const StatusIcon = status.icon

  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onView}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage
            src={application.casting.creator.avatar || "/placeholder.svg"}
            alt={application.casting.creator.name}
          />
          <AvatarFallback>{application.casting.creator.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{application.casting.title}</p>
          <p className="text-sm text-muted-foreground truncate">{application.casting.creator.name}</p>
          <div className="flex items-center gap-1 mt-2">
            {StatusIcon && <StatusIcon className={`w-3 h-3 ${status.color}`} />}
            <span className={`text-xs ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Card>
  )
}

function CastingCard({ casting, onView }: { casting: Casting; onView: () => void }) {
  const typeLabels = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  return (
    <Card className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors" onClick={onView}>
      {casting.images?.[0] && (
        <div className="h-32 bg-muted">
          <img
            src={casting.images[0] || "/placeholder.svg"}
            alt={casting.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0">
                {typeLabels[casting.type]}
              </Badge>
              {casting.pay.type !== "tbd" && (
                <span className="text-sm font-medium">
                  {casting.pay.amount.toLocaleString()} {casting.pay.currency}
                </span>
              )}
            </div>
            <h3 className="font-semibold mt-2 truncate">{casting.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="w-5 h-5">
                <AvatarImage src={casting.creator.avatar || "/placeholder.svg"} alt={casting.creator.name} />
                <AvatarFallback>{casting.creator.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate">{casting.creator.name}</span>
              {casting.creator.verified && <BadgeCheck className="w-3 h-3 text-foreground shrink-0" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {casting.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(casting.deadline, { addSuffix: true })}
          </span>
        </div>
      </div>
    </Card>
  )
}
