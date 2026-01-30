"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import type { Casting } from "@/lib/types"
import { Search, Plus } from "lucide-react"

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
    <div className="pb-20 min-h-screen bg-zinc-950">
      {/* Header: filter chips + search/add – Pinterest-style */}
      <div className="sticky top-14 z-30 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white text-zinc-950"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {getTabLabel(tab)}
                {tab === "applied" && !isCreator && userApplications.length > 0 && (
                  <span className="ml-1 opacity-80">{userApplications.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            {isCreator && onCreateCasting && (
              <Button
                onClick={onCreateCasting}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="px-4 pb-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search castings..."
            className="h-9 rounded-full bg-zinc-800/80 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 pl-4 text-sm"
          />
        </div>
      </div>

      {/* Feed – masonry grid, image-dominant pins */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-3 py-4"
        >
          {filteredCastings.length > 0 ? (
            <div className="pinterest-masonry-castings">
              {filteredCastings.map((casting, index) => {
                const appStatus = getApplicationStatus(casting.id)
                return (
                  <motion.div
                    key={casting.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.25) }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer rounded-2xl border-0 bg-zinc-900 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                      onClick={() => onViewCasting(casting)}
                    >
                      {/* Pin: image dominant */}
                      <div className="relative aspect-[3/4] bg-zinc-800 min-h-0">
                        <img
                          src={casting.images?.[0] || "/placeholder.svg"}
                          alt={casting.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                          <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            {typeLabels[casting.type]}
                          </span>
                          {appStatus && (
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                                appStatus === "shortlisted"
                                  ? "bg-amber-500/90 text-black"
                                  : appStatus === "accepted"
                                    ? "bg-emerald-500/90 text-black"
                                    : "bg-white/20 text-white"
                              }`}
                            >
                              {appStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Minimal caption: title + source */}
                      <div className="p-2.5">
                        <h3 className="font-medium text-xs text-zinc-100 line-clamp-2 leading-snug">
                          {casting.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-zinc-500 truncate">
                          {casting.creator.name}
                          {casting.location ? ` · ${casting.location.split(",")[0]}` : ""}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500">
              <p>No castings found</p>
              {activeTab === "invited" && (
                <p className="text-sm mt-1 text-zinc-600">You haven&apos;t been invited to any castings yet</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
