"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import { Eye, Users, Heart, MessageCircle, TrendingUp, Search, MapPin, Briefcase, Link2 } from "lucide-react"

interface ProfileAnalyticsData {
  totalViews: number
  views30d: number
  views7d: number
  uniqueViewers30d: number
  viewsBySource: { source: string; count: number }[]
  dailyViews: { date: string; count: number }[]
  followers: number
  following: number
  posts: number
  totalLikes: number
  totalComments: number
  engagementRate: number
}

const SOURCE_ICONS: Record<string, typeof Eye> = {
  discover: Search,
  casting: Briefcase,
  search: Search,
  direct: Link2,
}

const SOURCE_LABELS: Record<string, string> = {
  discover: "Discover",
  casting: "Castings",
  search: "Search",
  direct: "Direct Link",
}

export function ProfileAnalytics() {
  const [data, setData] = useState<ProfileAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    const res = await api.getProfileAnalytics()
    if (!res.error && res.data) {
      setData(res.data as ProfileAnalyticsData)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-8 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No analytics data available yet</p>
      </div>
    )
  }

  const maxDaily = Math.max(...data.dailyViews.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Profile Analytics
      </h3>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs">Profile Views</span>
          </div>
          <p className="text-2xl font-bold">{data.views30d.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Last 30 days</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">Unique Viewers</span>
          </div>
          <p className="text-2xl font-bold">{data.uniqueViewers30d.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Last 30 days</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-xs">Total Likes</span>
          </div>
          <p className="text-2xl font-bold">{data.totalLikes.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Across {data.posts} posts</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-xs">Engagement Rate</span>
          </div>
          <p className="text-2xl font-bold">{data.engagementRate}</p>
          <p className="text-[10px] text-muted-foreground">Avg per post</p>
        </Card>
      </div>

      {/* Views chart (mini bar chart) */}
      {data.dailyViews.length > 0 && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-3">Daily Views (30 days)</p>
          <div className="flex items-end gap-[2px] h-16">
            {data.dailyViews.map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/80 rounded-t-sm min-w-[2px] transition-all hover:bg-primary"
                style={{ height: `${(d.count / maxDaily) * 100}%` }}
                title={`${d.date}: ${d.count} views`}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Views by source */}
      {data.viewsBySource.length > 0 && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-3">Traffic Sources</p>
          <div className="space-y-2">
            {data.viewsBySource
              .sort((a, b) => b.count - a.count)
              .map((source) => {
                const Icon = SOURCE_ICONS[source.source] || MapPin
                const pct = data.views30d > 0 ? Math.round((source.count / data.views30d) * 100) : 0
                return (
                  <div key={source.source} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs flex-1">{SOURCE_LABELS[source.source] || source.source}</span>
                    <span className="text-xs text-muted-foreground">{source.count}</span>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* Summary footer */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>All time: {data.totalViews.toLocaleString()} views</span>
        <span>Last 7 days: {data.views7d} views</span>
      </div>
    </div>
  )
}
