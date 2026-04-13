"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  Send,
  Paperclip,
  MoreVertical,
  CheckCheck,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { CastingRoom, RoomEvent, User } from "@/lib/types"
import { api } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { format, formatDistanceToNow } from "date-fns"

interface ApiRoomEvent {
  id: string
  roomId: string
  type: string
  userId: string
  user: { id: string; username: string; name: string; avatar?: string; role: string } | null
  targetUserId?: string
  targetUser?: { id: string; username: string; name: string; avatar?: string; role: string } | null
  message?: string
  createdAt: string
}

interface ApiRoomFile {
  id: string
  roomId: string
  name: string
  type: string
  url: string
  uploadedBy: { id: string; username: string; name: string; avatar?: string } | null
  createdAt: string
}

interface ApiRoomScheduleItem {
  id: string
  roomId: string
  title: string
  date: string
  time: string
  location?: string
  notes?: string
}

interface ApiRoomMessage {
  id: string
  userId: string
  user: { id: string; username: string; name: string; avatar?: string; role: string }
  content: string
  createdAt: string
}

function apiUserToUser(u: { id: string; username: string; name: string; avatar?: string; role: string }): User {
  return {
    id: u.id,
    email: "",
    name: u.name,
    username: u.username,
    role: u.role as User["role"],
    verified: false,
    verificationLevel: "unverified",
    avatar: u.avatar || "",
    bio: "",
    location: "",
    followers: 0,
    following: 0,
    createdAt: new Date(),
    portfolio: [],
    polaroids: [],
    experience: [],
    tags: [],
  }
}

interface CastingRoomViewProps {
  room: CastingRoom
  onBack: () => void
  onViewProfile: (user: User) => void
}

export function CastingRoomView({ room, onBack, onViewProfile }: CastingRoomViewProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("timeline")
  const [messageInput, setMessageInput] = useState("")
  const [events, setEvents] = useState<RoomEvent[]>([])
  const [files, setFiles] = useState<ApiRoomFile[]>([])
  const [schedule, setSchedule] = useState<ApiRoomScheduleItem[]>([])
  const [messages, setMessages] = useState<ApiRoomMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Schedule calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleTitle, setScheduleTitle] = useState("")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [scheduleLocation, setScheduleLocation] = useState("")
  const [scheduleNotes, setScheduleNotes] = useState("")
  const [scheduleSaving, setScheduleSaving] = useState(false)

  // File upload state
  const [fileUploading, setFileUploading] = useState(false)

  const fetchEvents = useCallback(async () => {
    const res = await api.getRoomEvents(room.id)
    const data = res.data as { events?: ApiRoomEvent[] } | undefined
    if (data?.events) {
      setEvents(
        data.events.map((e) => ({
          id: e.id,
          roomId: e.roomId,
          type: e.type as RoomEvent["type"],
          userId: e.userId,
          user: e.user ? apiUserToUser(e.user) : apiUserToUser({ id: e.userId, username: "", name: "Unknown", role: "model" }),
          targetUserId: e.targetUserId,
          targetUser: e.targetUser ? apiUserToUser(e.targetUser) : undefined,
          message: e.message,
          createdAt: new Date(e.createdAt),
        }))
      )
    }
  }, [room.id])

  const fetchFiles = useCallback(async () => {
    const res = await api.getRoomFiles(room.id)
    const data = res.data as { files?: ApiRoomFile[] } | undefined
    if (data?.files) {
      setFiles(data.files)
    }
  }, [room.id])

  const fetchSchedule = useCallback(async () => {
    const res = await api.getRoomSchedule(room.id)
    const data = res.data as { schedule?: ApiRoomScheduleItem[] } | undefined
    if (data?.schedule) {
      setSchedule(data.schedule)
    }
  }, [room.id])

  const fetchMessages = useCallback(async () => {
    const res = await api.getRoomMessages(room.id)
    const data = res.data as { messages?: ApiRoomMessage[] } | undefined
    if (data?.messages) {
      setMessages(data.messages)
    }
  }, [room.id])

  useEffect(() => {
    fetchEvents()
    fetchFiles()
    fetchSchedule()
    fetchMessages()
  }, [fetchEvents, fetchFiles, fetchSchedule, fetchMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom()
    }
  }, [activeTab, messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return

    const content = messageInput
    setMessageInput("")

    const res = await api.sendRoomMessage(room.id, content)
    const data = res.data as { message?: ApiRoomMessage } | undefined
    if (data?.message) {
      setMessages((prev) => [...prev, data.message!])
    }
  }

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const handleAddScheduleItem = async () => {
    if (!scheduleTitle || !scheduleDate || !scheduleTime) return
    setScheduleSaving(true)
    await api.addRoomScheduleItem(room.id, {
      title: scheduleTitle,
      date: scheduleDate,
      time: scheduleTime,
      location: scheduleLocation || undefined,
      notes: scheduleNotes || undefined,
    })
    setScheduleSaving(false)
    setShowScheduleForm(false)
    setScheduleTitle("")
    setScheduleDate("")
    setScheduleTime("")
    setScheduleLocation("")
    setScheduleNotes("")
    fetchSchedule()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "casting_room")
    const uploadRes = await fetch("/api/media/upload", { method: "POST", credentials: "include", body: formData })
    if (uploadRes.ok) {
      const data = await uploadRes.json()
      if (data.url) {
        const fileType = file.name.match(/\.(pdf|doc|docx)$/i) ? "contract" : file.type.startsWith("image/") ? "moodboard" : "other"
        await api.uploadRoomFile(room.id, { name: file.name, type: fileType, url: data.url })
        fetchFiles()
      }
    }
    setFileUploading(false)
  }

  const getEventIcon = (type: RoomEvent["type"]) => {
    switch (type) {
      case "created":
        return "🎬"
      case "submission":
        return "📥"
      case "shortlisted":
        return "⭐"
      case "offer_sent":
        return "📨"
      case "offer_accepted":
        return "✅"
      case "member_added":
        return "👤"
      case "message":
        return "💬"
      default:
        return "📌"
    }
  }

  const getEventMessage = (event: RoomEvent) => {
    switch (event.type) {
      case "created":
        return `${event.user.name} created the casting room`
      case "submission":
        return `${event.user.name} submitted an application`
      case "shortlisted":
        return `${event.user.name} shortlisted ${event.targetUser?.name || "a model"}`
      case "offer_sent":
        return `${event.user.name} sent an offer to ${event.targetUser?.name || "a model"}`
      case "offer_accepted":
        return `${event.targetUser?.name || "A model"} accepted the offer`
      case "member_added":
        return `${event.targetUser?.name || "A member"} was added to the room`
      case "message":
        return event.message || "sent a message"
      default:
        return "Event"
    }
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-amber-500/10 text-amber-600",
    live: "bg-emerald-500/10 text-emerald-600",
    completed: "bg-sky-500/10 text-sky-600",
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 border-b border-border bg-background z-10">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-2 flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{room.casting.title}</h1>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${statusColors[room.status]}`}>
                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">{room.members.length} members</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Members preview */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="flex -space-x-2">
            {room.members.slice(0, 5).map((member) => (
              <Avatar
                key={member.id}
                className="w-7 h-7 border-2 border-background cursor-pointer"
                onClick={() => onViewProfile(member)}
              >
                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          {room.members.length > 5 && (
            <span className="text-xs text-muted-foreground">+{room.members.length - 5} more</span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border h-10 p-0 bg-transparent shrink-0">
          <TabsTrigger
            value="timeline"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent flex-1"
          >
            <Clock className="w-4 h-4 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="shortlist"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent flex-1"
          >
            <Users className="w-4 h-4 mr-1" />
            Members
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent flex-1"
          >
            <FileText className="w-4 h-4 mr-1" />
            Files
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent flex-1"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="flex-1 overflow-auto mt-0 p-4">
          <div className="space-y-4">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm">{getEventIcon(event.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{getEventMessage(event)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(event.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No events yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Members (confirmed models only) */}
        <TabsContent value="shortlist" className="flex-1 overflow-auto mt-0 p-4">
          <div className="space-y-2">
            {room.members
              .filter((m) => m.role === "model")
              .map((model) => (
                <Card
                  key={model.id}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onViewProfile(model)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
                    <AvatarFallback>{model.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.location}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500">
                    Confirmed
                  </Badge>
                </Card>
              ))}
            {room.members.filter((m) => m.role === "model").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No confirmed models yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.userId === user?.id ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={msg.user.avatar || "/placeholder.svg"} alt={msg.user.name} />
                  <AvatarFallback className="text-xs">{msg.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${msg.userId === user?.id ? "items-end" : ""}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      msg.userId === user?.id ? "bg-foreground text-background rounded-tr-sm" : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <p className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), "h:mm a")}</p>
                    {msg.userId === user?.id && <CheckCheck className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files" className="flex-1 overflow-auto mt-0 p-4">
          <div className="space-y-2">
            {/* Upload button */}
            <label className="block cursor-pointer">
              <Card className="p-3 flex items-center gap-3 border-dashed border-2 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {fileUploading ? (
                    <div className="w-5 h-5 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{fileUploading ? "Uploading..." : "Upload File"}</p>
                  <p className="text-xs text-muted-foreground">Contracts, moodboards, call sheets</p>
                </div>
              </Card>
              <input type="file" className="hidden" disabled={fileUploading} onChange={handleFileUpload} />
            </label>

            {files.map((file) => (
              <Card key={file.id} className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {file.type === "moodboard" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.uploadedBy?.name || "Unknown"} • {format(new Date(file.createdAt), "MMM d")}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {file.type}
                </Badge>
              </Card>
            ))}
            {files.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Schedule — Calendar View */}
        <TabsContent value="schedule" className="flex-1 overflow-auto mt-0 p-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
              else setCalMonth(calMonth - 1)
            }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-sm">
              {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
              else setCalMonth(calMonth + 1)
            }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 mb-4">
            {(() => {
              const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
              const firstDay = new Date(calYear, calMonth, 1).getDay()
              const cells = []
              // Empty cells before first day
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)
              // Day cells
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const dayEvents = schedule.filter((s) => s.date === dateStr)
                const isSelected = selectedDate === dateStr
                const isToday = dateStr === format(new Date(), "yyyy-MM-dd")
                cells.push(
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(dateStr)
                      setScheduleDate(dateStr)
                      setShowScheduleForm(true)
                    }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-colors ${
                      isSelected ? "bg-foreground text-background" :
                      isToday ? "bg-muted ring-1 ring-foreground/30" :
                      "hover:bg-muted/50"
                    }`}
                  >
                    <span className={`font-medium ${isSelected ? "" : ""}`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-background" : "bg-violet-500"}`} />
                    )}
                  </button>
                )
              }
              return cells
            })()}
          </div>

          {/* Existing events for selected date shown below calendar */}
          {selectedDate && schedule.filter((s) => s.date === selectedDate).length > 0 && (
            <div className="space-y-2 mt-2">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d")}
              </h4>
              {schedule.filter((s) => s.date === selectedDate).map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-full min-h-[40px] rounded-full bg-violet-500 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                      {item.location && <p className="text-xs text-muted-foreground mt-1">📍 {item.location}</p>}
                      {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!selectedDate && (
            <p className="text-center text-sm text-muted-foreground py-4">Tap a date to add an event</p>
          )}

          {/* Add event — centered popup dialog */}
          {showScheduleForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleForm(false)}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-background rounded-2xl p-5 shadow-2xl border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold text-base mb-4">
                  {selectedDate ? format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d") : "Add Event"}
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Title (e.g. Fitting, Shoot Day 1)"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    autoFocus
                  />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                  <Input
                    placeholder="Location (optional)"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                  />
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleAddScheduleItem} disabled={scheduleSaving || !scheduleTitle || !scheduleTime}>
                      {scheduleSaving ? "Saving..." : "Add Event"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
