"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import { Eye, Users, TrendingUp, BarChart3, Bookmark, ArrowRight } from "lucide-react"

interface CastingAnalyticsData {
  totalViews: number
  views30d: number
  uniqueViewers: number
  dailyViews: { date: string; count: number }[]
  funnel: {
    views: number
    applications: number
    shortlisted: number
    offered: number
    accepted: number
    confirmed: number
    rejected: number
    declined: number
  }
  conversionRate: number
  savedCount: number
}

interface CastingAnalyticsProps {
  castingId: string
}

const FUNNEL_STEPS = [
  { key: "views", label: "Views", color: "bg-blue-500" },
  { key: "applications", label: "Applied", color: "bg-indigo-500" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-amber-500" },
  { key: "offered", label: "Offered", color: "bg-orange-500" },
  { key: "accepted", label: "Accepted", color: "bg-emerald-500" },
  { key: "confirmed", label: "Confirmed", color: "bg-green-600" },
] as const

export function CastingAnalytics({ castingId }: CastingAnalyticsProps) {
  const [data, setData] = useState<CastingAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    const res = await api.getCastingAnalytics(castingId)
    if (!res.error && res.data) {
      setData(res.data as CastingAnalyticsData)
    }
    setLoading(false)
  }, [castingId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3 mb-2" />
            <div className="h-8 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No analytics data yet</p>
      </div>
    )
  }

  const maxFunnel = Math.max(data.funnel.views, 1)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2 text-sm">
        <BarChart3 className="w-4 h-4" />
        Casting Analytics
      </h3>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2.5 text-center">
          <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{data.totalViews}</p>
          <p className="text-[10px] text-muted-foreground">Views</p>
        </Card>
        <Card className="p-2.5 text-center">
          <Users className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{data.uniqueViewers}</p>
          <p className="text-[10px] text-muted-foreground">Unique</p>
        </Card>
        <Card className="p-2.5 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{data.conversionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Apply Rate</p>
        </Card>
      </div>

      {/* Conversion funnel */}
      <Card className="p-3">
        <p className="text-xs text-muted-foreground mb-3">Conversion Funnel</p>
        <div className="space-y-2">
          {FUNNEL_STEPS.map((step, i) => {
            const value = data.funnel[step.key as keyof typeof data.funnel]
            const pct = maxFunnel > 0 ? (value / maxFunnel) * 100 : 0
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs">{step.label}</span>
                  <span className="text-xs font-medium">{value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${step.color} transition-all`}
                    style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
                  />
                </div>
                {i < FUNNEL_STEPS.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50 rotate-90" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {(data.funnel.rejected > 0 || data.funnel.declined > 0) && (
          <div className="flex gap-4 mt-3 pt-2 border-t text-xs text-muted-foreground">
            {data.funnel.rejected > 0 && <span>Rejected: {data.funnel.rejected}</span>}
            {data.funnel.declined > 0 && <span>Declined: {data.funnel.declined}</span>}
          </div>
        )}
      </Card>

      {/* Daily views mini chart */}
      {data.dailyViews.length > 0 && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-2">Daily Views</p>
          <div className="flex items-end gap-[2px] h-12">
            {data.dailyViews.map((d, i) => {
              const maxD = Math.max(...data.dailyViews.map((v) => v.count), 1)
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary/80 rounded-t-sm min-w-[2px] hover:bg-primary"
                  style={{ height: `${(d.count / maxD) * 100}%` }}
                  title={`${d.date}: ${d.count}`}
                />
              )
            })}
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Bookmark className="w-3 h-3" />
        <span>Saved by {data.savedCount} users</span>
      </div>
    </div>
  )
}
