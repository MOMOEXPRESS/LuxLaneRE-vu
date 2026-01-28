"use client"

import { SlidersHorizontal } from "lucide-react"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"

interface MarketplaceHeaderProps {
  onFilterClick: () => void
  activeFiltersCount: number
}

export function MarketplaceHeader({ onFilterClick, activeFiltersCount }: MarketplaceHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="flex items-center justify-between h-14 px-4">
        <LuxlaneLogo size="sm" />

        <button
          onClick={onFilterClick}
          className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
