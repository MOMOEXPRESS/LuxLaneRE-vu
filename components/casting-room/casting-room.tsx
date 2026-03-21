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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
            Shortlist
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

        {/* Shortlist */}
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
                  <Badge variant="secondary" className="text-[10px]">
                    Shortlisted
                  </Badge>
                </Card>
              ))}
            {room.members.filter((m) => m.role === "model").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No models shortlisted yet</p>
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
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="flex-1 overflow-auto mt-0 p-4">
          <div className="space-y-3">
            {schedule.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg font-bold">{format(new Date(item.date), "d")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(item.date), "MMM")}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                    {item.location && <p className="text-xs text-muted-foreground mt-1">{item.location}</p>}
                    {item.notes && <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {schedule.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No events scheduled yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
