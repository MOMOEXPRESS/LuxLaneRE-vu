"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { api, type AgencyRosterItem } from "@/lib/api-client"
import type { User } from "@/lib/types"
import { Search, Plus, BadgeCheck, MapPin, ChevronRight, Users } from "lucide-react"

interface RosterViewProps {
  onViewProfile: (user: User) => void
  onSubmitToCasting?: (user: User) => void
  onNavigateToScout?: () => void
}

export function RosterView({ onViewProfile, onSubmitToCasting, onNavigateToScout }: RosterViewProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [roster, setRoster] = useState<AgencyRosterItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoster = useCallback(async () => {
    const res = await api.getAgencyRoster()
    const data = res.data as { roster?: AgencyRosterItem[] } | undefined
    if (data?.roster) {
      setRoster(data.roster)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRoster()
  }, [fetchRoster])

  const filteredModels = roster.filter((model) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      model.displayName.toLowerCase().includes(searchLower) ||
      model.username.toLowerCase().includes(searchLower) ||
      (model.location || "").toLowerCase().includes(searchLower)
    )
  })

  // Convert roster item to User shape for onViewProfile
  const rosterItemToUser = (item: AgencyRosterItem): User => ({
    id: item.id,
    name: item.displayName,
    username: item.username,
    avatar: item.avatarUrl || "/placeholder.svg",
    role: "model",
    email: item.email,
    verified: item.verificationStatus !== "UNVERIFIED",
    verificationLevel: (item.verificationStatus?.toLowerCase() || "unverified") as any,
    bio: item.bio || "",
    location: item.location || "",
    followers: 0,
    following: 0,
    createdAt: new Date(),
  })

  return (
    <div className="pb-20">
      {/* Search & Add */}
      <div className="px-4 py-3 border-b border-border sticky top-14 bg-background z-30">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roster..."
              className="pl-9 h-10"
            />
          </div>
          <Button size="icon" className="h-10 w-10 shrink-0" onClick={onNavigateToScout}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm text-muted-foreground">{roster.length} models in your roster</p>
      </div>

      {/* Roster List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading roster...</div>
        ) : filteredModels.length > 0 ? (
          filteredModels.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onViewProfile(rosterItemToUser(model))}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={model.avatarUrl || "/placeholder.svg"} alt={model.displayName} />
                    <AvatarFallback>{model.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{model.displayName}</span>
                      {model.verificationStatus !== "UNVERIFIED" && (
                        <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {model.location || "No location"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">Score: {model.luxlaneScore}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{model.availability || "available"}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No models in your roster yet</p>
            <p className="text-sm mt-1">Go to Scout to find and invite models</p>
            {onNavigateToScout && (
              <Button className="mt-4" onClick={onNavigateToScout}>
                <Search className="w-4 h-4 mr-2" /> Scout Models
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
