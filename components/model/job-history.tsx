"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { Briefcase, MapPin, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"

interface HistorySubmission {
  id: string
  status: string
  note: string | null
  createdAt: string
  updatedAt: string
  casting: {
    id: string
    title: string
    type: string
    status: string
    location: string | null
    startDate: string | null
    endDate: string | null
    payMin: number | null
    payMax: number | null
    creator: {
      id: string
      username: string
      name: string
      avatar: string | null
      role: string
    }
  } | null
}

const STATUS_BADGES: Record<string, string> = {
  ACCEPTED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CONFIRMED: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  DECLINED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
}

const FILTER_TABS = [
  { value: "", label: "All" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DECLINED", label: "Declined" },
  { value: "REJECTED", label: "Not Selected" },
]

export function JobHistory() {
  const [submissions, setSubmissions] = useState<HistorySubmission[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const res = await api.getJobHistory({ status: filter || undefined, limit: 50 })
    const data = res.data as { submissions?: HistorySubmission[]; total?: number } | undefined
    if (data?.submissions) {
      setSubmissions(data.submissions)
      setTotal(data.total || data.submissions.length)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const formatPay = (min: number | null, max: number | null) => {
    if (!min && !max) return null
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    return `$${(min || max)!.toLocaleString()}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Job History
        </h3>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "outline"}
            size="sm"
            className="text-xs shrink-0"
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No job history yet</p>
          <p className="text-xs mt-1">Your completed, accepted, and declined bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{sub.casting?.title || "Unknown Casting"}</p>
                  <p className="text-xs text-muted-foreground">{sub.casting?.creator?.name || "Unknown"}</p>
                </div>
                <Badge className={`text-[10px] shrink-0 ml-2 ${STATUS_BADGES[sub.status] || ""}`}>
                  {sub.status === "REJECTED" ? "Not Selected" : sub.status.charAt(0) + sub.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {sub.casting?.type && (
                  <span className="capitalize">{sub.casting.type.toLowerCase()}</span>
                )}
                {sub.casting?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {sub.casting.location}
                  </span>
                )}
                {sub.casting?.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(sub.casting.startDate), "MMM d, yyyy")}
                  </span>
                )}
                {formatPay(sub.casting?.payMin || null, sub.casting?.payMax || null) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatPay(sub.casting?.payMin || null, sub.casting?.payMax || null)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Applied {format(new Date(sub.createdAt), "MMM d, yyyy")}
                {sub.updatedAt !== sub.createdAt && ` · Updated ${format(new Date(sub.updatedAt), "MMM d, yyyy")}`}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
