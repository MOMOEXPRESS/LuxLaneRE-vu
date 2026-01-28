"use client"

import { useState } from "react"
import { MarketplaceHeader } from "./marketplace-header"
import { TalentCard } from "./talent-card"
import { FilterSheet, type FilterState } from "./filter-sheet"
import { BookingSheet } from "./booking-sheet"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"

interface MarketplaceViewProps {
  onProfileClick: (userId: string) => void
}

const defaultFilters: FilterState = {
  talentType: [],
  location: [],
  availability: "any",
  priceRange: [0, 10000],
  verified: false,
  tier: [],
}

export function MarketplaceView({ onProfileClick }: MarketplaceViewProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [bookingTalent, setBookingTalent] = useState<User | null>(null)

  // Filter models and talent
  const talent = mockUsers.filter((u) => u.role === "model")

  const filteredTalent = talent.filter((user) => {
    if (filters.verified && !user.verified) return false
    if (filters.tier.length > 0 && !filters.tier.includes(user.tier)) return false
    if (filters.location.length > 0) {
      const userCity = user.location.split(",")[0].trim()
      if (!filters.location.some((loc) => userCity.toLowerCase().includes(loc.toLowerCase()))) return false
    }
    return true
  })

  const activeFiltersCount = [
    filters.talentType.length > 0,
    filters.location.length > 0,
    filters.verified,
    filters.tier.length > 0,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen pb-20">
      <MarketplaceHeader onFilterClick={() => setShowFilters(true)} activeFiltersCount={activeFiltersCount} />

      <main className="pt-14 px-4">
        {/* Hero */}
        <div className="py-6">
          <h1 className="font-serif text-2xl font-light">
            Discover <span className="text-gold">Elite Talent</span>
          </h1>
          <p className="text-muted-foreground mt-1">Book top models, photographers, and creatives</p>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{filteredTalent.length} talent available</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredTalent.map((user) => (
            <TalentCard key={user.id} user={user} onClick={() => setBookingTalent(user)} />
          ))}
        </div>

        {filteredTalent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="font-serif text-lg">No talent found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        )}
      </main>

      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setShowFilters(false)
        }}
        initialFilters={filters}
      />

      {bookingTalent && (
        <BookingSheet
          isOpen={!!bookingTalent}
          onClose={() => setBookingTalent(null)}
          talent={bookingTalent}
          onSubmit={(booking) => {
            console.log("Booking submitted:", booking)
            setBookingTalent(null)
          }}
        />
      )}
    </div>
  )
}
