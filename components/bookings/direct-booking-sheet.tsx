"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import { Loader2, Send } from "lucide-react"

interface DirectBookingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelId: string
  modelName: string
}

export function DirectBookingSheet({
  open,
  onOpenChange,
  modelId,
  modelName,
}: DirectBookingSheetProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setLocation("")
    setStartDate("")
    setEndDate("")
    setPayAmount("")
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await api.createBooking({
      modelId,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      payAmount: payAmount ? Math.round(parseFloat(payAmount) * 100) : undefined,
    })

    setSubmitting(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      resetForm()
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Book {modelName}</SheetTitle>
        </SheetHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-lg font-medium">Booking request sent!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {modelName} will be notified and can accept or decline.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="booking-title">Title *</Label>
              <Input
                id="booking-title"
                placeholder="e.g. Summer Campaign Shoot"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-description">Description</Label>
              <Textarea
                id="booking-description"
                placeholder="Describe the job, expectations, deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-location">Location</Label>
              <Input
                id="booking-location"
                placeholder="e.g. Paris, Studio 5"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="booking-start">Start Date</Label>
                <Input
                  id="booking-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-end">End Date</Label>
                <Input
                  id="booking-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-pay">Pay Amount (EUR)</Label>
              <Input
                id="booking-pay"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the total amount in euros. Leave empty if to be discussed.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full h-12"
              onClick={handleSubmit}
              disabled={submitting || !title.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Booking Request
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
