"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface AvailabilityDate {
  date: string // "2026-03-20"
  status: string // "AVAILABLE" | "HOLD" | "BOOKED"
}

interface AvailabilityCalendarProps {
  userId: string
  isOwn: boolean
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  HOLD: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  BOOKED: "bg-red-500/20 text-red-600 border-red-500/30",
}

const STATUS_CYCLE = ["AVAILABLE", "HOLD", "BOOKED"] as const

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function AvailabilityCalendar({ userId, isOwn }: AvailabilityCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [dates, setDates] = useState<Map<string, string>>(new Map()) // date -> status
  const [selectedTool, setSelectedTool] = useState<string>("AVAILABLE")

  const monthStr = formatMonth(viewYear, viewMonth)

  const fetchDates = useCallback(async () => {
    const res = await api.getAvailability(monthStr, userId)
    const data = res.data as { dates?: AvailabilityDate[] } | undefined
    if (data?.dates) {
      const map = new Map<string, string>()
      for (const d of data.dates) {
        map.set(d.date, d.status)
      }
      setDates(map)
    }
  }, [monthStr, userId])

  useEffect(() => {
    fetchDates()
  }, [fetchDates])

  const handleDayClick = useCallback(
    async (dateStr: string) => {
      if (!isOwn) return

      const currentStatus = dates.get(dateStr)
      if (currentStatus === selectedTool) {
        // Remove the entry
        await api.deleteAvailability([dateStr])
        setDates((prev) => {
          const next = new Map(prev)
          next.delete(dateStr)
          return next
        })
      } else {
        // Set or update the status
        await api.setAvailability([{ date: dateStr, status: selectedTool }])
        setDates((prev) => {
          const next = new Map(prev)
          next.set(dateStr, selectedTool)
          return next
        })
      }
    },
    [isOwn, dates, selectedTool],
  )

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth)
  const todayStr = today.toISOString().split("T")[0]

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  })

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Availability
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[130px] text-center">{monthName}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status tool selector — only for model owners */}
      {isOwn && (
        <div className="flex gap-2 mb-3">
          {STATUS_CYCLE.map((status) => (
            <Button
              key={status}
              variant={selectedTool === status ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setSelectedTool(status)}
            >
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  status === "AVAILABLE" ? "bg-emerald-500" : status === "HOLD" ? "bg-amber-500" : "bg-red-500"
                }`}
              />
              {status === "AVAILABLE" ? "Available" : status === "HOLD" ? "On Hold" : "Booked"}
            </Button>
          ))}
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const status = dates.get(dateStr)
          const isToday = dateStr === todayStr
          const isPast = new Date(dateStr) < new Date(todayStr)

          const bgClass = status
            ? STATUS_COLORS[status] || ""
            : isPast
              ? "text-muted-foreground/40"
              : ""

          return (
            <button
              key={day}
              type="button"
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors border border-transparent ${bgClass} ${
                isToday ? "ring-1 ring-foreground/30" : ""
              } ${isOwn && !isPast ? "cursor-pointer hover:bg-muted" : "cursor-default"}`}
              onClick={() => !isPast && handleDayClick(dateStr)}
              disabled={!isOwn || isPast}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
          Available
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/30" />
          On Hold
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/30" />
          Booked
        </div>
      </div>

      {isOwn && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Tap a date to mark it with the selected status. Tap again to clear.
        </p>
      )}
    </Card>
  )
}
