"use client"

import { Ruler, Eye, Scissors } from "lucide-react"
import type { ModelMeasurements } from "@/lib/types"

interface ModelCompCardProps {
  measurements: ModelMeasurements
  portfolio?: string[]
}

export function ModelCompCard({ measurements, portfolio }: ModelCompCardProps) {
  return (
    <div className="px-4 py-4 border-b border-border/30">
      {/* Measurements */}
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Measurements</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="h-4 w-4 text-gold" />
            <span className="text-xs text-muted-foreground">Height</span>
          </div>
          <span className="font-medium">{measurements.height}</span>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="h-4 w-4 text-gold" />
            <span className="text-xs text-muted-foreground">Bust</span>
          </div>
          <span className="font-medium">{measurements.bust}</span>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="h-4 w-4 text-gold" />
            <span className="text-xs text-muted-foreground">Waist</span>
          </div>
          <span className="font-medium">{measurements.waist}</span>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="h-4 w-4 text-gold" />
            <span className="text-xs text-muted-foreground">Hips</span>
          </div>
          <span className="font-medium">{measurements.hips}</span>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-gold" />
            <span className="text-xs text-muted-foreground">Eyes</span>
          </div>
          <span className="font-medium">{measurements.eyeColor}</span>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-4 w-4 text-gold text-sm">💇</span>
            <span className="text-xs text-muted-foreground">Hair</span>
          </div>
          <span className="font-medium">{measurements.hairColor}</span>
        </div>
      </div>

      {/* Portfolio Preview */}
      {portfolio && portfolio.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Portfolio</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {portfolio.map((image, index) => (
              <div key={index} className="flex-shrink-0 w-28 h-36 rounded-xl overflow-hidden">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
