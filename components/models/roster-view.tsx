"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"
import { Search, Plus, BadgeCheck, MapPin, ChevronRight } from "lucide-react"

interface RosterViewProps {
  onViewProfile: (user: User) => void
  onSubmitToCasting?: (user: User) => void
}

export function RosterView({ onViewProfile, onSubmitToCasting }: RosterViewProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState("")

  // Get agency's roster models
  const rosterModels =
    user?.role === "agency" && user?.roster ? mockUsers.filter((u) => user.roster?.includes(u.id)) : []

  const filteredModels = rosterModels.filter((model) => {
    if (search) {
      const searchLower = search.toLowerCase()
      return model.name.toLowerCase().includes(searchLower) || model.location.toLowerCase().includes(searchLower)
    }
    return true
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
          <Button size="icon" className="h-10 w-10 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm text-muted-foreground">{rosterModels.length} models in your roster</p>
      </div>

      {/* Roster List */}
      <div className="p-4 space-y-3">
        {filteredModels.length > 0 ? (
          filteredModels.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onViewProfile(model)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
                    <AvatarFallback>{model.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{model.name}</span>
                      {model.verified && <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {model.location}
                    </div>
                    {model.measurements && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {model.measurements.height}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {model.measurements.hairColor}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {model.measurements.eyeColor}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
                {onSubmitToCasting && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSubmitToCasting(model)
                      }}
                    >
                      Submit to Casting
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No models found</p>
            {rosterModels.length === 0 && <p className="text-sm mt-1">Add models to your roster to get started</p>}
          </div>
        )}
      </div>
    </div>
  )
}
