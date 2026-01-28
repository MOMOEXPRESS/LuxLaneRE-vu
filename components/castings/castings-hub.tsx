"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import type { Casting } from "@/lib/types"
import { Search, MapPin, BadgeCheck, Plus, ChevronRight, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type CastingTab = "active" | "foryou" | "invited" | "applied" | "shortlisted" | "booked"

interface CastingsHubProps {
  onViewCasting: (casting: Casting) => void
  onCreateCasting?: () => void
}

export function CastingsHub({ onViewCasting, onCreateCasting }: CastingsHubProps) {
  const { user } = useAuth()
  const { getActiveCastings, getCastingsForCreator, getApplicationsForModel, getCastings } = useStore()
  const [activeTab, setActiveTab] = useState<CastingTab>("active")
  const [search, setSearch] = useState("")

  const isCreator = user?.role === "brand" || user?.role === "agency"

  // Get user's applications from store
  const userApplications = user ? getApplicationsForModel(user.id) : []
  const appliedCastingIds = userApplications.map((a) => a.castingId)
  const shortlistedCastingIds = userApplications.filter((a) => a.status === "shortlisted").map((a) => a.castingId)
  const bookedCastingIds = userApplications.filter((a) => a.status === "accepted").map((a) => a.castingId)

  // Get creator's own castings from store
  const myCastings = user ? getCastingsForCreator(user.id) : []

  // Tab labels based on role
  const getTabLabel = (tab: CastingTab) => {
    if (isCreator) {
      switch (tab) {
        case "applied":
          return "Submissions"
        case "booked":
          return "Confirmed"
        default:
          return tab.charAt(0).toUpperCase() + tab.slice(1)
      }
    }
    return tab.charAt(0).toUpperCase() + tab.slice(1)
  }

  const tabs: CastingTab[] = isCreator
    ? ["active", "applied", "shortlisted", "booked"]
    : ["active", "foryou", "invited", "applied", "shortlisted", "booked"]

  // Filter castings based on tab - using store methods
  const getFilteredCastings = (): Casting[] => {
    let castings: Casting[] = []
    const allCastings = getCastings()
    const activeCastings = getActiveCastings()

    switch (activeTab) {
      case "active":
        castings = isCreator ? myCastings : activeCastings
        break
      case "foryou":
        // Mock "for you" - castings matching user tags (simplified)
        castings = activeCastings.slice(0, 3)
        break
      case "invited":
        // Mock invited castings
        castings = []
        break
      case "applied":
        castings = isCreator
          ? myCastings.filter((c) => c.applicationsCount > 0)
          : allCastings.filter((c) => appliedCastingIds.includes(c.id))
        break
      case "shortlisted":
        castings = allCastings.filter((c) => shortlistedCastingIds.includes(c.id))
        break
      case "booked":
        castings = allCastings.filter((c) => bookedCastingIds.includes(c.id))
        break
    }

    // Apply search filter
    if (search) {
      castings = castings.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.creator.name.toLowerCase().includes(search.toLowerCase()) ||
          c.location.toLowerCase().includes(search.toLowerCase()),
      )
    }

    return castings
  }

  const filteredCastings = getFilteredCastings()

  const typeLabels: Record<string, string> = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  // Get application status for a casting
  const getApplicationStatus = (castingId: string) => {
    const app = userApplications.find((a) => a.castingId === castingId)
    return app?.status
  }

  return (
    <div className="pb-20">
      {/* Search */}
      <div className="px-4 py-3 border-b border-border sticky top-14 bg-background z-30">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search castings..."
              className="pl-9 h-10"
            />
          </div>
          {isCreator && onCreateCasting && (
            <Button onClick={onCreateCasting} size="icon" className="h-10 w-10 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="shrink-0 h-8"
          >
            {getTabLabel(tab)}
            {tab === "applied" && !isCreator && userApplications.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{userApplications.length}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4"
        >
          {filteredCastings.length > 0 ? (
            <div className="space-y-3">
              {filteredCastings.map((casting, index) => {
                const appStatus = getApplicationStatus(casting.id)
                return (
                  <motion.div
                    key={casting.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => onViewCasting(casting)}
                    >
                      <div className="flex">
                        {/* Image */}
                        {casting.images?.[0] && (
                          <div className="w-24 h-24 shrink-0 bg-muted">
                            <img
                              src={casting.images[0] || "/placeholder.svg"}
                              alt={casting.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {/* Content */}
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {typeLabels[casting.type]}
                              </Badge>
                              {appStatus && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] h-5 ${
                                    appStatus === "shortlisted"
                                      ? "bg-warning/10 text-warning border-warning/20"
                                      : appStatus === "accepted"
                                        ? "bg-success/10 text-success border-success/20"
                                        : ""
                                  }`}
                                >
                                  {appStatus}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                          <h3 className="font-medium text-sm mt-1 truncate">{casting.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage
                                src={casting.creator.avatar || "/placeholder.svg"}
                                alt={casting.creator.name}
                              />
                              <AvatarFallback className="text-[8px]">{casting.creator.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">{casting.creator.name}</span>
                            {casting.creator.verified && <BadgeCheck className="w-3 h-3 text-foreground shrink-0" />}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {casting.location.split(",")[0]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(casting.deadline, { addSuffix: false })}
                            </span>
                            <span className="font-medium text-foreground">
                              {casting.pay.type === "tbd"
                                ? "TBD"
                                : `${casting.pay.currency} ${casting.pay.amount.toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No castings found</p>
              {activeTab === "invited" && <p className="text-sm mt-1">You haven't been invited to any castings yet</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
