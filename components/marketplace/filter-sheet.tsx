"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterState) => void
  initialFilters: FilterState
}

export interface FilterState {
  talentType: string[]
  location: string[]
  availability: string
  priceRange: [number, number]
  verified: boolean
  tier: string[]
}

const talentTypes = ["Models", "Photographers", "Stylists", "Makeup Artists", "Hair Stylists"]
const locations = ["New York", "Los Angeles", "Paris", "Milan", "London", "Tokyo"]
const tiers = ["Black", "Elite", "Free"]

export function FilterSheet({ isOpen, onClose, onApply, initialFilters }: FilterSheetProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [expandedSection, setExpandedSection] = useState<string | null>("talentType")

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[]
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) }
      }
      return { ...prev, [key]: [...current, value] }
    })
  }

  const handleReset = () => {
    setFilters({
      talentType: [],
      location: [],
      availability: "any",
      priceRange: [0, 10000],
      verified: false,
      tier: [],
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <button onClick={handleReset} className="text-sm text-gold">
            Reset
          </button>
          <h2 className="font-serif text-lg">Filters</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Talent Type */}
          <div className="border-b border-border/30">
            <button
              onClick={() => setExpandedSection(expandedSection === "talentType" ? null : "talentType")}
              className="w-full flex items-center justify-between p-4"
            >
              <span className="font-medium">Talent Type</span>
              <ChevronDown
                className={cn("h-5 w-5 transition-transform", expandedSection === "talentType" && "rotate-180")}
              />
            </button>
            {expandedSection === "talentType" && (
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {talentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter("talentType", type)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-colors",
                      filters.talentType.includes(type)
                        ? "bg-gold text-primary-foreground"
                        : "bg-secondary/50 text-foreground hover:bg-secondary",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="border-b border-border/30">
            <button
              onClick={() => setExpandedSection(expandedSection === "location" ? null : "location")}
              className="w-full flex items-center justify-between p-4"
            >
              <span className="font-medium">Location</span>
              <ChevronDown
                className={cn("h-5 w-5 transition-transform", expandedSection === "location" && "rotate-180")}
              />
            </button>
            {expandedSection === "location" && (
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => toggleFilter("location", loc)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-colors",
                      filters.location.includes(loc)
                        ? "bg-gold text-primary-foreground"
                        : "bg-secondary/50 text-foreground hover:bg-secondary",
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tier */}
          <div className="border-b border-border/30">
            <button
              onClick={() => setExpandedSection(expandedSection === "tier" ? null : "tier")}
              className="w-full flex items-center justify-between p-4"
            >
              <span className="font-medium">Membership Tier</span>
              <ChevronDown className={cn("h-5 w-5 transition-transform", expandedSection === "tier" && "rotate-180")} />
            </button>
            {expandedSection === "tier" && (
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {tiers.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => toggleFilter("tier", tier.toLowerCase())}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-colors",
                      filters.tier.includes(tier.toLowerCase())
                        ? "bg-gold text-primary-foreground"
                        : "bg-secondary/50 text-foreground hover:bg-secondary",
                    )}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Verified Only */}
          <div className="p-4 border-b border-border/30">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, verified: !prev.verified }))}
              className="w-full flex items-center justify-between"
            >
              <span className="font-medium">Verified Only</span>
              <div
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  filters.verified ? "bg-gold" : "bg-secondary",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-foreground transition-transform",
                    filters.verified ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-border/30">
          <Button
            onClick={() => onApply(filters)}
            className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}
