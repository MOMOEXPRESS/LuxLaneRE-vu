"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { mockUsers } from "@/lib/mock-data"
import { useStore } from "@/lib/store-context"
import type { User, Casting } from "@/lib/types"
import { Search, BadgeCheck, MapPin, Users, Building2, Briefcase } from "lucide-react"

type Category = "all" | "brands" | "agencies" | "clients" | "castings"

interface DiscoverViewProps {
  onViewProfile: (user: User) => void
  onViewCasting: (casting: Casting) => void
}

export function DiscoverView({ onViewProfile, onViewCasting }: DiscoverViewProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<Category>("all")
  const { castings } = useStore()

  const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: null },
    { id: "brands", label: "Brands", icon: <Briefcase className="w-4 h-4" /> },
    { id: "agencies", label: "Agencies", icon: <Building2 className="w-4 h-4" /> },
    { id: "clients", label: "Clients", icon: <Users className="w-4 h-4" /> },
    { id: "castings", label: "Castings", icon: null },
  ]

  const filteredUsers = mockUsers.filter((user) => {
    if (user.role === "model") return false
    if (search && !user.name.toLowerCase().includes(search.toLowerCase())) return false
    if (category === "brands" && user.role !== "brand") return false
    if (category === "agencies" && user.role !== "agency") return false
    if (category === "clients" && user.role !== "client") return false
    if (category === "castings") return false
    return true
  })

  const filteredCastings = castings.filter((casting) => {
    if (search && !casting.title.toLowerCase().includes(search.toLowerCase())) return false
    return casting.status === "active"
  })

  return (
    <div className="pb-20">
      {/* Search */}
      <div className="px-4 py-3 border-b border-border sticky top-14 bg-background z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands, agencies, castings..."
            className="pl-9 h-11"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={category === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat.id)}
            className="shrink-0"
          >
            {cat.icon}
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {category !== "castings" && filteredUsers.length > 0 && (
          <section className="mb-6">
            {category === "all" && <h2 className="font-semibold mb-3">Brands & Agencies</h2>}
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <UserCard user={user} onView={() => onViewProfile(user)} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {(category === "all" || category === "castings") && filteredCastings.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3">Open Castings</h2>
            <div className="space-y-3">
              {filteredCastings.map((casting, index) => (
                <motion.div
                  key={casting.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <CastingListCard casting={casting} onView={() => onViewCasting(casting)} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {filteredUsers.length === 0 && filteredCastings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No results found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function UserCard({ user, onView }: { user: User; onView: () => void }) {
  const roleLabels = {
    brand: "Brand",
    agency: "Agency",
    client: "Client",
    model: "Model",
  }

  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onView}>
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{user.name}</span>
            {user.verified && <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-xs">
              {roleLabels[user.role]}
            </Badge>
            {user.industry && <span className="text-xs text-muted-foreground">{user.industry}</span>}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {user.location}
          </div>
        </div>
      </div>
    </Card>
  )
}

function CastingListCard({ casting, onView }: { casting: Casting; onView: () => void }) {
  const typeLabels = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  return (
    <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onView}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={casting.creator.avatar || "/placeholder.svg"} alt={casting.creator.name} />
          <AvatarFallback>{casting.creator.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[casting.type]}
            </Badge>
            {casting.pay.type !== "tbd" && (
              <span className="text-xs font-medium">
                {casting.pay.amount.toLocaleString()} {casting.pay.currency}
              </span>
            )}
          </div>
          <p className="font-medium mt-1 truncate">{casting.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{casting.creator.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {casting.location}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
