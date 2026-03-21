"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { DollarSign, TrendingUp, Clock, CheckCircle, Ban } from "lucide-react"
import { format } from "date-fns"

interface EarningItem {
  id: string
  amount: number
  currency: string
  description: string | null
  status: string
  paidAt: string | null
  createdAt: string
  casting: {
    id: string
    title: string
    type: string
    creator: { id: string; username: string; name: string; avatar: string | null }
  } | null
}

interface EarningsData {
  earnings: EarningItem[]
  total: number
  summary: { totalEarned: number; totalPending: number; currency: string }
  monthlyEarnings: { month: string; total: number }[]
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  PAID: { icon: CheckCircle, color: "text-emerald-500", label: "Paid" },
  PENDING: { icon: Clock, color: "text-amber-500", label: "Pending" },
  CANCELLED: { icon: Ban, color: "text-red-500", label: "Cancelled" },
}

const FILTER_TABS = [
  { value: "", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
]

export function EarningsDashboard() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchEarnings = useCallback(async () => {
    setLoading(true)
    const res = await api.getEarnings({ status: filter || undefined })
    if (!res.error && res.data) {
      setData(res.data as EarningsData)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  const formatAmount = (cents: number, currency: string) => {
    return `${currency} ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

  if (loading && !data) {
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

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Earnings
      </h3>

      {/* Summary cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs">Total Earned</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">
              {formatAmount(data.summary.totalEarned, data.summary.currency)}
            </p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs">Pending</span>
            </div>
            <p className="text-xl font-bold text-amber-500">
              {formatAmount(data.summary.totalPending, data.summary.currency)}
            </p>
          </Card>
        </div>
      )}

      {/* Monthly chart */}
      {data?.monthlyEarnings && data.monthlyEarnings.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Monthly Earnings</p>
          </div>
          <div className="flex items-end gap-1 h-20">
            {data.monthlyEarnings.map((m, i) => {
              const max = Math.max(...data.monthlyEarnings.map((e) => e.total), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-emerald-500/80 rounded-t-sm hover:bg-emerald-500 transition-colors"
                    style={{ height: `${(m.total / max) * 100}%` }}
                    title={`${m.month}: ${formatAmount(m.total, "EUR")}`}
                  />
                  <span className="text-[8px] text-muted-foreground">{m.month.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Earnings list */}
      {!data?.earnings.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No earnings yet</p>
          <p className="text-xs mt-1">Your payments from completed bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.earnings.map((earning) => {
            const config = STATUS_CONFIG[earning.status] || STATUS_CONFIG.PENDING
            const StatusIcon = config.icon
            return (
              <Card key={earning.id} className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {earning.casting?.title || earning.description || "Payment"}
                    </p>
                    {earning.casting?.creator && (
                      <p className="text-xs text-muted-foreground">{earning.casting.creator.name}</p>
                    )}
                  </div>
                  <p className={`font-semibold text-sm shrink-0 ml-2 ${earning.status === "PAID" ? "text-emerald-500" : ""}`}>
                    {formatAmount(earning.amount, earning.currency)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {earning.paidAt
                      ? `Paid ${format(new Date(earning.paidAt), "MMM d, yyyy")}`
                      : format(new Date(earning.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
