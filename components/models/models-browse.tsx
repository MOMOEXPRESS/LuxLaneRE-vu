"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { api } from "@/lib/api-client"
import type { User } from "@/lib/types"
import {
  Search,
  SlidersHorizontal,
  BadgeCheck,
  MapPin,
  Shield,
  Scan,
  GitCompare,
  X,
  Check,
  TrendingUp,
} from "lucide-react"

interface ModelsBrowseProps {
  onViewProfile: (user: User) => void
  onInviteToCasting?: (user: User) => void
  onMessage?: (user: User) => void
  onCompare?: (models: [User, User]) => void
}

export function ModelsBrowse({ onViewProfile, onInviteToCasting, onMessage, onCompare }: ModelsBrowseProps) {
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    location: "",
    minHeight: "",
    maxHeight: "",
    hairColor: "",
    verified: false,
    hasDigitalTwin: false,
    verificationLevel: "any" as "any" | "agency_verified" | "luxlane_verified",
  })
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<User[]>([])
  const [models, setModels] = useState<User[]>([])
  const [savedModels, setSavedModels] = useState<User[]>([])
  const [viewMode, setViewMode] = useState<"all" | "saved">("all")
  const [loading, setLoading] = useState(true)

  const fetchSavedModels = useCallback(async () => {
    const res = await api.getSavedModels()
    const data = res.data as { savedModels?: any[] } | undefined
    if (data?.savedModels) {
      setSavedModels(data.savedModels.map((s: any) => ({
        id: s.model?.id || s.modelId,
        name: s.model?.displayName || s.model?.username || "Model",
        username: s.model?.username || "",
        email: "",
        role: "model" as const,
        avatar: s.model?.avatarUrl || "/placeholder.svg",
        verified: false,
        verificationLevel: "unverified" as const,
        bio: s.model?.bio || "",
        location: s.model?.location || "",
        followers: 0, following: 0,
        createdAt: new Date(),
      })))
    }
  }, [])

  const fetchModels = useCallback(async () => {
    setLoading(true)
    const res = await api.getModels({ unsigned: true, limit: 50 })
    const data = res.data as { models?: any[] } | undefined
    if (data?.models) {
      setModels(data.models.map((m: any) => ({
        id: m.id,
        name: m.displayName || m.username,
        username: m.username,
        email: "",
        role: "model" as const,
        avatar: m.avatarUrl || "/placeholder.svg",
        verified: m.verified || false,
        verificationLevel: m.verificationStatus?.toLowerCase()?.includes("luxlane") ? "luxlane_verified" as const : m.verificationStatus?.toLowerCase()?.includes("agency") ? "agency_verified" as const : "unverified" as const,
        bio: m.bio || "",
        location: m.location || "",
        followers: 0,
        following: 0,
        createdAt: new Date(m.createdAt),
        measurements: m.height ? { height: m.height, bust: m.bust, waist: m.waist, hips: m.hips, hairColor: m.hairColor, eyeColor: m.eyeColor, heightCm: parseInt(m.height) || 0 } : undefined,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchModels(); fetchSavedModels() }, [fetchModels, fetchSavedModels])

  const filteredModels = models.filter((model) => {
    if (search) {
      const searchLower = search.toLowerCase()
      if (!model.name.toLowerCase().includes(searchLower) && !model.location.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    if (filters.verified && !model.verified) return false
    if (filters.location && !model.location.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (filters.hasDigitalTwin && model.digitalTwin?.status !== "complete") return false
    if (filters.verificationLevel !== "any" && model.verificationLevel !== filters.verificationLevel) return false
    return true
  })

  const sortedModels = [...filteredModels].sort(
    (a, b) => (b.metrics?.luxlaneScore || 0) - (a.metrics?.luxlaneScore || 0),
  )

  const handleModelClick = (model: User) => {
    if (compareMode) {
      if (selectedForCompare.find((m) => m.id === model.id)) {
        setSelectedForCompare(selectedForCompare.filter((m) => m.id !== model.id))
      } else if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, model])
      }
    } else {
      onViewProfile(model)
    }
  }

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompare) {
      onCompare([selectedForCompare[0], selectedForCompare[1]])
      setCompareMode(false)
      setSelectedForCompare([])
    }
  }

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case "luxlane_verified":
        return (
          <Badge className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] h-5">
            <Shield className="w-2.5 h-2.5 mr-0.5" />
            Luxlane
          </Badge>
        )
      case "agency_verified":
        return (
          <Badge className="absolute top-2 right-2 bg-sky-500 text-white text-[9px] h-5">
            <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />
            Agency
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="pb-20">
      {/* Search & Filter */}
      <div className="px-4 py-3 border-b border-border sticky top-14 bg-background z-30">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="icon"
            className={`h-10 w-10 shrink-0 ${!compareMode ? "bg-transparent" : ""}`}
            onClick={() => {
              setCompareMode(!compareMode)
              setSelectedForCompare([])
            }}
          >
            <GitCompare className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 bg-transparent"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {compareMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compare Mode</p>
                <p className="text-xs text-muted-foreground">Select 2 models to compare</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedForCompare.length}/2</Badge>
                <Button size="sm" onClick={handleCompare} disabled={selectedForCompare.length !== 2}>
                  Compare
                </Button>
              </div>
            </div>
            {selectedForCompare.length > 0 && (
              <div className="flex gap-2 mt-2">
                {selectedForCompare.map((model) => (
                  <Badge key={model.id} variant="outline" className="gap-1">
                    {model.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedForCompare(selectedForCompare.filter((m) => m.id !== model.id))
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* All / Saved toggle */}
      <div className="flex gap-2 px-4 pt-3">
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
        >
          All
        </button>
        <button
          onClick={() => setViewMode("saved")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === "saved" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
        >
          Saved {savedModels.length > 0 && `(${savedModels.length})`}
        </button>
      </div>

      {/* Results */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {viewMode === "saved" ? `${savedModels.length} saved models` : `${sortedModels.length} models found`}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(viewMode === "saved" ? savedModels : sortedModels).map((model, index) => {
            const isSelected = selectedForCompare.find((m) => m.id === model.id)
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`overflow-hidden cursor-pointer transition-all ${
                    compareMode
                      ? isSelected
                        ? "ring-2 ring-foreground"
                        : "hover:ring-1 hover:ring-foreground/50"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => handleModelClick(model)}
                >
                  <div className="aspect-[3/4] bg-muted relative">
                    <img
                      src={model.avatar || "/placeholder.svg"}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                    {getVerificationBadge(model.verificationLevel)}
                    {model.digitalTwin?.status === "complete" && (
                      <Badge className="absolute top-2 left-2 bg-violet-500 text-white text-[9px] h-5">
                        <Scan className="w-2.5 h-2.5 mr-0.5" />
                        Twin
                      </Badge>
                    )}
                    {compareMode && isSelected && (
                      <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                          <Check className="w-6 h-6 text-background" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{model.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {model.location.split(",")[0]}
                    </div>
                    {model.measurements && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {model.measurements.height}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {model.measurements.hairColor}
                        </Badge>
                      </div>
                    )}
                    {model.metrics && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          {model.metrics.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                          <span className="text-[10px] text-muted-foreground">#{model.metrics.rank}</span>
                        </div>
                        <span className="text-xs font-semibold">{model.metrics.luxlaneScore}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
          <SheetHeader className="text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="e.g. Paris, New York"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Verification Level</label>
              <div className="flex gap-2">
                {[
                  { value: "any", label: "Any" },
                  { value: "agency_verified", label: "Agency" },
                  { value: "luxlane_verified", label: "Luxlane" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.verificationLevel === option.value ? "default" : "outline"}
                    size="sm"
                    className={filters.verificationLevel !== option.value ? "bg-transparent" : ""}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        verificationLevel: option.value as typeof filters.verificationLevel,
                      })
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Digital Twin Available</label>
                <p className="text-xs text-muted-foreground">Only show models with 3D twin</p>
              </div>
              <Button
                variant={filters.hasDigitalTwin ? "default" : "outline"}
                size="sm"
                className={!filters.hasDigitalTwin ? "bg-transparent" : ""}
                onClick={() => setFilters({ ...filters, hasDigitalTwin: !filters.hasDigitalTwin })}
              >
                {filters.hasDigitalTwin ? "Yes" : "No"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Verified Only</label>
              <Button
                variant={filters.verified ? "default" : "outline"}
                size="sm"
                className={!filters.verified ? "bg-transparent" : ""}
                onClick={() => setFilters({ ...filters, verified: !filters.verified })}
              >
                {filters.verified ? "Yes" : "No"}
              </Button>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setFilters({
                    location: "",
                    minHeight: "",
                    maxHeight: "",
                    hairColor: "",
                    verified: false,
                    hasDigitalTwin: false,
                    verificationLevel: "any",
                  })
                }}
              >
                Clear
              </Button>
              <Button className="flex-1" onClick={() => setShowFilters(false)}>
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
