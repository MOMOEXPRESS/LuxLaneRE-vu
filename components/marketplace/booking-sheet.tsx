"use client"

import { useState } from "react"
import { X, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"

interface BookingSheetProps {
  isOpen: boolean
  onClose: () => void
  talent: User
  onSubmit: (booking: BookingData) => void
}

interface BookingData {
  talentId: string
  type: string
  date: Date
  duration: number
  location: string
  notes: string
}

const bookingTypes = [
  { id: "photoshoot", label: "Photoshoot", rate: 500 },
  { id: "runway", label: "Runway Show", rate: 2000 },
  { id: "commercial", label: "Commercial", rate: 3000 },
  { id: "event", label: "Event", rate: 1500 },
]

const durations = [
  { hours: 2, label: "2 hours" },
  { hours: 4, label: "Half day (4h)" },
  { hours: 8, label: "Full day (8h)" },
]

export function BookingSheet({ isOpen, onClose, talent, onSubmit }: BookingSheetProps) {
  const [step, setStep] = useState<"type" | "datetime" | "details" | "confirm">("type")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(4)
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")

  const [currentMonth, setCurrentMonth] = useState(new Date())

  const selectedBookingType = bookingTypes.find((t) => t.id === selectedType)
  const totalCost = selectedBookingType ? selectedBookingType.rate * (selectedDuration / 2) : 0

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const handleSubmit = () => {
    if (selectedDate) {
      onSubmit({
        talentId: talent.id,
        type: selectedType,
        date: selectedDate,
        duration: selectedDuration,
        location,
        notes,
      })
    }
    onClose()
  }

  const resetAndClose = () => {
    setStep("type")
    setSelectedType("")
    setSelectedDate(null)
    setSelectedDuration(4)
    setLocation("")
    setNotes("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={resetAndClose} />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          {step !== "type" ? (
            <button
              onClick={() => setStep(step === "datetime" ? "type" : step === "details" ? "datetime" : "details")}
              className="w-10 h-10 flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <h2 className="font-serif text-lg">Book {talent.name}</h2>
          <button onClick={resetAndClose} className="w-10 h-10 flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 pt-4">
          {["type", "datetime", "details", "confirm"].map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                ["type", "datetime", "details", "confirm"].indexOf(step) >= i ? "bg-gold" : "bg-secondary",
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {step === "type" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Select the type of booking</p>
              {bookingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all flex items-center justify-between",
                    selectedType === type.id
                      ? "bg-gold/10 border border-gold"
                      : "bg-secondary/50 border border-transparent hover:bg-secondary",
                  )}
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-muted-foreground">From {formatCurrency(type.rate)}/hr</span>
                </button>
              ))}
            </div>
          )}

          {step === "datetime" && (
            <div className="space-y-6">
              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-medium">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div key={day} className="py-2 text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                    const isSelected = selectedDate?.toDateString() === date.toDateString()
                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && setSelectedDate(date)}
                        disabled={isPast}
                        className={cn(
                          "py-2 rounded-lg transition-colors min-h-[44px]",
                          isSelected ? "bg-gold text-primary-foreground" : "hover:bg-secondary",
                          isPast && "opacity-30 cursor-not-allowed",
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration</label>
                <div className="flex gap-2">
                  {durations.map((d) => (
                    <button
                      key={d.hours}
                      onClick={() => setSelectedDuration(d.hours)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm transition-colors",
                        selectedDuration === d.hours
                          ? "bg-gold text-primary-foreground"
                          : "bg-secondary/50 hover:bg-secondary",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter shoot location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-secondary/50 border-0 rounded-xl text-base focus:ring-2 focus:ring-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes for {talent.name}</label>
                <Textarea
                  placeholder="Add any specific requirements or details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] bg-secondary/50 border-0 rounded-xl resize-none text-base"
                />
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={talent.avatar || "/placeholder.svg"}
                    alt={talent.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{talent.name}</h3>
                    <span className="text-sm text-muted-foreground capitalize">{talent.role}</span>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gold" />
                    <span>
                      {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gold" />
                    <span>
                      {selectedDuration} hours - {selectedBookingType?.label}
                    </span>
                  </div>
                  {location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gold" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border/50" />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-serif font-medium text-gold">{formatCurrency(totalCost)}</span>
                </div>
              </div>

              {notes && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
                  <p className="mt-1 text-sm">{notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          {step === "confirm" ? (
            <Button
              onClick={handleSubmit}
              className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium"
            >
              <Check className="mr-2 h-5 w-5" />
              Confirm Booking
            </Button>
          ) : (
            <Button
              onClick={() => setStep(step === "type" ? "datetime" : step === "datetime" ? "details" : "confirm")}
              disabled={(step === "type" && !selectedType) || (step === "datetime" && !selectedDate)}
              className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium disabled:opacity-50"
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
