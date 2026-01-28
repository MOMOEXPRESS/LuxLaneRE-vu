"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Trophy, TrendingUp, Star, Bookmark, Shirt, ImageIcon, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { getModels } from "@/lib/mock-data"
import type { User } from "@/lib/types"

type ScoreboardTab = "top" | "rising" | "booked" | "shortlisted" | "runway" | "editorial"

interface ScoreboardViewProps {
  onBack: () => void
  onViewProfile: (user: User) => void
}

export function ScoreboardView({ onBack, onViewProfile }: ScoreboardViewProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ScoreboardTab>("top")

  const tabs: { id: ScoreboardTab; label: string; icon: React.ReactNode }[] = [
    { id: "top", label: "Top Models", icon: <Trophy className="w-4 h-4" /> },
    { id: "rising", label: "Rising", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "booked", label: "Most Booked", icon: <Star className="w-4 h-4" /> },
    { id: "shortlisted", label: "Most Shortlisted", icon: <Bookmark className="w-4 h-4" /> },
    { id: "runway", label: "Best Runway", icon: <Shirt className="w-4 h-4" /> },
    { id: "editorial", label: "Best Editorial", icon: <ImageIcon className="w-4 h-4" /> },
  ]

  // Get models for each tab
  const getModelsForTab = (): User[] => {
    const allModels = getModels()
    switch (activeTab) {
      case "top":
        return allModels.sort((a, b) => (b.metrics?.luxlaneScore || 0) - (a.metrics?.luxlaneScore || 0))
      case "rising":
        return allModels
          .filter((m) => m.metrics?.trend === "up")
          .sort((a, b) => (b.metrics?.trendChange || 0) - (a.metrics?.trendChange || 0))
      case "booked":
        return allModels.sort((a, b) => (b.metrics?.components.bookings || 0) - (a.metrics?.components.bookings || 0))
      case "shortlisted":
        return allModels.sort(
          (a, b) => (b.metrics?.components.shortlists || 0) - (a.metrics?.components.shortlists || 0),
        )
      case "runway":
        return allModels.filter((m) => m.tags?.includes("runway"))
      case "editorial":
        return allModels.filter((m) => m.tags?.includes("editorial"))
      default:
        return allModels
    }
  }

  const models = getModelsForTab()

  const getTierBadge = (tier: string) => {
    const tierStyles: Record<string, string> = {
      top10: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      top50: "bg-gradient-to-r from-slate-400 to-slate-500 text-white",
      top100: "bg-gradient-to-r from-amber-700 to-amber-800 text-white",
      top500: "bg-muted text-muted-foreground",
      rising: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
      new: "bg-muted text-muted-foreground",
    }

    const tierLabels: Record<string, string> = {
      top10: "Top 10",
      top50: "Top 50",
      top100: "Top 100",
      top500: "Top 500",
      rising: "Rising",
      new: "New",
    }

    return <Badge className={`text-[10px] ${tierStyles[tier] || ""}`}>{tierLabels[tier]}</Badge>
  }

  // My Rank card for models
  const currentModel = user?.role === "model" ? user : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-semibold">Scoreboard</h1>
      </header>

      {/* My Rank Card (for models) */}
      {currentModel && currentModel.metrics && (
        <div className="p-4">
          <Card className="p-4 bg-gradient-to-br from-muted/50 to-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Your Rank</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-bold">#{currentModel.metrics.rank}</span>
                  {getTierBadge(currentModel.metrics.rankTier)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Luxlane Score</p>
                <p className="text-2xl font-bold">{currentModel.metrics.luxlaneScore}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {currentModel.metrics.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : currentModel.metrics.trend === "down" ? (
                  <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-muted" />
                )}
                <span className="text-sm">
                  {currentModel.metrics.trend === "up" && `+${currentModel.metrics.trendChange} this month`}
                  {currentModel.metrics.trend === "down" && `-${currentModel.metrics.trendChange} this month`}
                  {currentModel.metrics.trend === "stable" && "Stable ranking"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Need 2 more shortlists to reach {currentModel.metrics.rankTier === "top50" ? "Top 10" : "next tier"}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar border-b border-border">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="shrink-0 h-8 gap-1.5"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Models List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4"
        >
          <div className="space-y-2">
            {models.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onViewProfile(model)}
                >
                  {/* Rank */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      index < 3 ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" : "bg-muted"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
                    <AvatarFallback>{model.name[0]}</AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{model.name}</span>
                      {model.metrics && getTierBadge(model.metrics.rankTier)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {model.metrics?.achievements.slice(0, 2).map((ach, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] h-4">
                          {ach}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{model.metrics?.luxlaneScore || 0}</p>
                    <div className="flex items-center gap-0.5 justify-end">
                      {model.metrics?.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                      {model.metrics?.trend === "down" && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                      <span
                        className={`text-[10px] ${
                          model.metrics?.trend === "up"
                            ? "text-emerald-500"
                            : model.metrics?.trend === "down"
                              ? "text-red-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {model.metrics?.trend === "up" && `+${model.metrics.trendChange}`}
                        {model.metrics?.trend === "down" && `-${model.metrics.trendChange}`}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
