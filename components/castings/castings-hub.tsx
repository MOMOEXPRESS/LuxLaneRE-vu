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
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 auto-rows-auto">
              {filteredCastings.map((casting, index) => {
                const appStatus = getApplicationStatus(casting.id)
                const isFeatured = index % 5 === 0
                return (
                  <motion.div
                    key={casting.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.25) }}
                    className={isFeatured ? "col-span-2 row-span-2" : ""}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer rounded-xl border-0 bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97] !p-0 !gap-0 h-full"
                      onClick={() => onViewCasting(casting)}
                    >
                      {/* Compact tile image */}
                      <div className={`relative bg-zinc-800 ${isFeatured ? "h-full" : "aspect-square"}`}>
                        <img
                          src={casting.images?.[0] || "/placeholder.svg"}
                          alt={casting.title}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute top-1.5 left-1.5 flex items-center gap-1`}>
                          <span className={`rounded bg-black/60 backdrop-blur-sm font-medium text-white ${isFeatured ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[9px]"}`}>
                            {typeLabels[casting.type]}
                          </span>
                          {appStatus && (
                            <span
                              className={`rounded font-medium backdrop-blur-sm ${isFeatured ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[9px]"} ${
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
                        {/* Featured card has overlay caption at bottom of image */}
                        {isFeatured && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                            <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug">
                              {casting.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-zinc-300 truncate">
                              {casting.creator.name}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Compact caption — only for non-featured cards */}
                      {!isFeatured && (
                        <div className="p-1.5">
                          <h3 className="font-medium text-[10px] text-zinc-100 line-clamp-2 leading-tight">
                            {casting.title}
                          </h3>
                          <p className="mt-0.5 text-[9px] text-zinc-500 truncate">
                            {casting.creator.name}
                          </p>
                        </div>
                      )}
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
