"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import { useConversations, useMessages } from "@/lib/hooks/use-conversations"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { api } from "@/lib/api-client"
import type { User as UserType } from "@/lib/types"
import type { Conversation, Message, JobOffer, Notification, CastingApplication } from "@/lib/types"
import {
  ArrowLeft,
  Send,
  BadgeCheck,
  Sparkles,
  Check,
  X,
  Bell,
  Briefcase,
  Star,
  MessageSquare,
  UserPlus,
  CheckCircle,
  CalendarCheck,
} from "lucide-react"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"

type InboxTab = "messages" | "bookings" | "notifications"

interface InboxViewProps {
  onViewProfile?: (user: import("@/lib/types").User) => void
  initialConversationId?: string | null
  onConversationOpened?: () => void
  onOpenCastingRoom?: (castingId: string) => void
  onNavigateToTab?: (tab: string) => void
}

function mapApiConversationToConversation(apiConv: {
  id: string
  type: string
  castingTitle?: string | null
  castingId?: string | null
  members: Array<{ id: string; displayName?: string; avatarUrl?: string | null; username: string }>
  lastMessage: { id: string; content: string; senderId: string; createdAt: string } | null
  unreadCount: number
}): Conversation & { castingTitle?: string | null; castingId?: string | null } {
  const participants: UserType[] = apiConv.members.map((m) => ({
    id: m.id,
    name: m.displayName ?? m.username,
    username: m.username,
    avatar: m.avatarUrl ?? "/placeholder.svg",
    role: "model",
    verified: false,
    verificationLevel: "unverified",
    email: "",
    bio: "",
    location: "",
    followers: 0,
    following: 0,
    createdAt: new Date(),
  }))
  const lastMessage: Message = apiConv.lastMessage
    ? {
        id: apiConv.lastMessage.id,
        conversationId: apiConv.id,
        senderId: apiConv.lastMessage.senderId,
        content: apiConv.lastMessage.content,
        type: "text",
        read: true,
        createdAt: new Date(apiConv.lastMessage.createdAt),
      }
    : {
        id: "",
        conversationId: apiConv.id,
        senderId: "",
        content: "",
        type: "text",
        read: true,
        createdAt: new Date(),
      }
  return {
    id: apiConv.id,
    type: (apiConv.type === "casting_room" ? "casting" : apiConv.type) as Conversation["type"],
    castingTitle: apiConv.castingTitle,
    castingId: apiConv.castingId,
    participants,
    lastMessage,
    unreadCount: apiConv.unreadCount,
    updatedAt: new Date(),
  }
}

export function InboxView({ onViewProfile, initialConversationId, onConversationOpened, onOpenCastingRoom, onNavigateToTab }: InboxViewProps = {}) {
  const { user } = useAuth()
  const { conversations: apiConversations, isLoading: conversationsLoading, refresh: refreshConversations } = useConversations()
  const { notifications: apiNotifications, unreadCount, refresh: refreshNotifications } = useNotifications()
  const [activeTab, setActiveTab] = useState<InboxTab>("messages")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [dismissedInitial, setDismissedInitial] = useState(false)

  const conversations = (apiConversations ?? []).map(mapApiConversationToConversation)

  // Map API notifications to frontend Notification type
  const notifications: Notification[] = (apiNotifications ?? []).map((n: any) => ({
    id: n.id,
    userId: n.userId || user?.id || "",
    type: n.type?.toLowerCase() || "system",
    title: n.payload?.title || n.title || "Notification",
    message: n.payload?.message || n.payload?.body || n.message || "",
    read: n.read ?? false,
    actionUrl: n.payload?.castingId ? `/castings/${n.payload.castingId}` : undefined,
    metadata: n.payload || {},
    createdAt: new Date(n.createdAt),
  }))

  // Auto-open conversation if initialConversationId is provided (only once)
  useEffect(() => {
    if (initialConversationId && conversations.length > 0 && !selectedConversation && !dismissedInitial) {
      const conv = conversations.find((c: Conversation) => c.id === initialConversationId)
      if (conv) {
        setSelectedConversation(conv)
        onConversationOpened?.()
      }
    }
  }, [initialConversationId, conversations, selectedConversation, dismissedInitial, onConversationOpened])

  // Fetch real bookings + offers from store (loaded from DB)
  const { getApplicationsForModel, refreshCastings } = useStore()
  const allApplications = user ? getApplicationsForModel(user.id) : []
  const offeredApplications = allApplications.filter((a) => a.status === "offered")
  const bookingApplications = allApplications.filter(
    (a) => a.status === "accepted" || a.status === "shortlisted" || a.status === "confirmed"
  )

  if (selectedConversation) {
    return (
      <ChatView
        conversation={selectedConversation}
        onBack={() => { setSelectedConversation(null); setDismissedInitial(true) }}
        onViewProfile={onViewProfile}
        refreshConversations={refreshConversations}
      />
    )
  }

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead()
    refreshNotifications()
  }

  const handleMarkOneRead = async (notificationId: string) => {
    await api.markNotificationRead(notificationId)
    refreshNotifications()
  }

  return (
    <div className="pb-20">
      {/* Tabs */}
      <div className="flex border-b border-border sticky top-14 bg-background z-30">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "messages" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative ${
            activeTab === "bookings"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Bookings
          {bookingApplications.length > 0 && (
            <span className="absolute top-2 ml-1 px-1.5 py-0.5 text-[10px] bg-foreground text-background rounded-full">
              {bookingApplications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative ${
            activeTab === "notifications"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Notifications
          {unreadCount > 0 && (
            <span className="absolute top-2 ml-1 px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "messages" && (
          <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {conversationsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading…</div>
            ) : conversations.length > 0 ? (
              <div className="divide-y divide-border">
                {conversations.map((conversation: any) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={user?.id || ""}
                    onClick={() => {
                      if (conversation.type === "casting" && conversation.castingId && onOpenCastingRoom) {
                        onOpenCastingRoom(conversation.castingId)
                      } else {
                        setSelectedConversation(conversation)
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "bookings" && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            {/* Pending Offers — need Accept/Decline */}
            {offeredApplications.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Pending Offers</h3>
                {offeredApplications.map((app) => (
                  <Card key={app.id} className="p-4 space-y-3 mb-3 border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{app.casting?.title || "Casting"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.casting?.creator?.name || "Brand"}</p>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Offer
                      </Badge>
                    </div>
                    {app.casting?.location && (
                      <p className="text-xs text-muted-foreground">{app.casting.location}</p>
                    )}
                    {app.casting?.pay && (
                      <p className="text-sm font-medium">{app.casting.pay.amount.toLocaleString()} {app.casting.pay.currency}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={async () => {
                          await api.declineOffer(app.id)
                          refreshCastings()
                        }}
                      >
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          await api.acceptOffer(app.id)
                          refreshCastings()
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Confirmed bookings */}
            {bookingApplications.length > 0 ? (
              <div className="space-y-3">
                {offeredApplications.length > 0 && <h3 className="text-sm font-medium text-muted-foreground mb-2">Bookings</h3>}
                {bookingApplications.map((application) => (
                  <BookingCard key={application.id} application={application} onOpenCastingRoom={onOpenCastingRoom} />
                ))}
              </div>
            ) : offeredApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No bookings yet</p>
                <p className="text-xs mt-1">Accepted casting applications will appear here</p>
              </div>
            ) : null}
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            {unreadCount > 0 && (
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  Mark all as read
                </Button>
              </div>
            )}

            {/* Notifications Section */}
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => handleMarkOneRead(notification.id)}
                    onNavigate={(tab) => setActiveTab(tab as InboxTab)}
                    onAgencyRespond={async (applicationId, action) => {
                      await api.respondToAgencyApplication(applicationId, action)
                      refreshNotifications()
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationItem({ notification, onRead, onAgencyRespond, onNavigate }: { notification: Notification; onRead: () => void; onAgencyRespond?: (applicationId: string, action: "accept" | "reject") => void; onNavigate?: (tab: string) => void }) {
  const [responding, setResponding] = useState(false)
  const isAgencyInvite = notification.metadata?.relatedType === "agency_application" && notification.metadata?.relatedId

  const getIcon = () => {
    switch (notification.type) {
      case "casting_invite":
        return <Briefcase className="w-5 h-5" />
      case "shortlisted":
        return <Star className="w-5 h-5 text-warning" />
      case "offer":
        return <Sparkles className="w-5 h-5 text-success" />
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-success" />
      case "message":
        return <MessageSquare className="w-5 h-5" />
      case "follow":
        return <UserPlus className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  return (
    <Card
      className={`p-4 cursor-pointer transition-colors ${!notification.read ? "bg-muted/50 border-foreground/20" : ""}`}
      onClick={() => {
        onRead()
        // Navigate based on notification type
        if (onNavigate) {
          const type = notification.type
          if (type === "shortlisted" || type === "offer" || type === "accepted" || notification.title?.includes("confirmed")) {
            onNavigate("bookings")
          }
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${!notification.read ? "bg-foreground/10" : "bg-muted"}`}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${!notification.read ? "" : "text-muted-foreground"}`}>
              {notification.title}
            </span>
            {!notification.read && <span className="w-2 h-2 bg-foreground rounded-full" />}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
          {isAgencyInvite && onAgencyRespond && !responding && (
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setResponding(true)
                  onAgencyRespond(notification.metadata!.relatedId!, "reject")
                }}
              >
                <X className="w-3 h-3 mr-1" /> Decline
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setResponding(true)
                  onAgencyRespond(notification.metadata!.relatedId!, "accept")
                }}
              >
                <Check className="w-3 h-3 mr-1" /> Accept
              </Button>
            </div>
          )}
          {responding && <p className="text-xs text-muted-foreground mt-2">Response sent</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  )
}

function ConversationItem({
  conversation,
  currentUserId,
  onClick,
}: {
  conversation: Conversation & { castingTitle?: string | null; castingId?: string | null }
  currentUserId: string
  onClick: () => void
}) {
  const isCastingRoom = conversation.type === "casting"
  const otherUser = conversation.participants.find((p) => p.id !== currentUserId) || conversation.participants[0]

  if (!otherUser && !isCastingRoom) return null

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) return format(date, "HH:mm")
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMM d")
  }

  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="w-12 h-12">
          {isCastingRoom ? (
            <>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-violet-600 text-white text-xs">CR</AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src={otherUser?.avatar || "/placeholder.svg"} alt={otherUser?.name} />
              <AvatarFallback>{otherUser?.name?.[0]}</AvatarFallback>
            </>
          )}
        </Avatar>
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs font-medium rounded-full flex items-center justify-center">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className={`font-medium truncate ${conversation.unreadCount > 0 ? "" : "text-muted-foreground"}`}>
              {isCastingRoom ? (conversation as any).castingTitle || "Casting Room" : otherUser?.name || "Unknown"}
            </span>
            {isCastingRoom && <Badge variant="secondary" className="text-[9px] ml-1 shrink-0">Room</Badge>}
            {!isCastingRoom && otherUser?.verified && <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {conversation.lastMessage.id
              ? formatMessageTime(conversation.lastMessage.createdAt)
              : "—"}
          </span>
        </div>
        <p
          className={`text-sm truncate mt-0.5 ${conversation.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}
        >
          {conversation.lastMessage.content || "No messages yet"}
        </p>
        {conversation.type === "casting" && (
          <Badge variant="secondary" className="mt-1 text-xs">
            Casting
          </Badge>
        )}
      </div>
    </button>
  )
}

function ChatView({
  conversation,
  onBack,
  onViewProfile,
  refreshConversations,
}: {
  conversation: Conversation
  onBack: () => void
  onViewProfile?: (u: UserType) => void
  refreshConversations?: () => void
}) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const { messages: apiMessages, isLoading: messagesLoading, refresh: refreshMessages } = useMessages(conversation.id)

  const messages: Message[] = (apiMessages ?? []).map((m: { id: string; content: string; senderId: string; createdAt: string }) => ({
    id: m.id,
    conversationId: conversation.id,
    senderId: m.senderId,
    content: m.content,
    type: "text" as const,
    read: true,
    createdAt: new Date(m.createdAt),
  }))

  const otherUser = conversation.participants.find((p) => p.id !== user?.id) || conversation.participants[0]

  const handleSend = async () => {
    if (!message.trim() || !user) return
    const text = message.trim()
    setMessage("")
    const res = await api.sendMessage(conversation.id, text)
    if (res.error) return
    refreshMessages()
    refreshConversations?.()
  }

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""

    msgs.forEach((msg) => {
      const msgDate = format(msg.createdAt, "yyyy-MM-dd")
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d, yyyy")
  }

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMessages()
    }, 3000)
    return () => clearInterval(interval)
  }, [refreshMessages])

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <button
          type="button"
          className="flex flex-1 items-center gap-3 min-w-0 text-left"
          onClick={() => onViewProfile?.(otherUser)}
        >
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium truncate">{otherUser.name}</span>
              {otherUser.verified && <BadgeCheck className="w-4 h-4 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate capitalize">{otherUser.role}</p>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          groupMessagesByDate(messages).map((group) => (
            <div key={group.date}>
              <div className="text-center mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {formatDateHeader(group.date)}
                </span>
              </div>
              <div className="space-y-2">
                {group.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.senderId === user?.id
                          ? "bg-foreground text-background rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${msg.senderId === user?.id ? "text-background/60" : "text-muted-foreground"}`}
                      >
                        {format(msg.createdAt, "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input — always visible */}
      <div className="p-3 border-t border-border shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-11"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            autoFocus
          />
          <Button size="icon" onClick={handleSend} disabled={!message.trim()} className="h-11 w-11">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function BookingCard({ application, onOpenCastingRoom }: { application: CastingApplication; onOpenCastingRoom?: (castingId: string) => void }) {
  const statusColors: Record<string, string> = {
    accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    confirmed: "bg-green-500/10 text-green-600 border-green-500/20",
    shortlisted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    offered: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  }

  const statusLabels: Record<string, string> = {
    accepted: "Accepted",
    confirmed: "Confirmed",
    shortlisted: "Shortlisted",
    offered: "Offer Pending",
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {application.casting?.title || "Casting"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {application.casting?.creator?.name || "Brand"}
          </p>
        </div>
        <Badge variant="outline" className={statusColors[application.status] || ""}>
          {application.status === "accepted" && <CheckCircle className="w-3 h-3 mr-1" />}
          {application.status === "shortlisted" && <Star className="w-3 h-3 mr-1" />}
          {statusLabels[application.status] || application.status}
        </Badge>
      </div>
      {application.casting?.location && (
        <p className="text-xs text-muted-foreground">
          {application.casting.location}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Applied {formatDistanceToNow(application.submittedAt, { addSuffix: true })}</span>
        {application.casting?.pay && (
          <span className="font-medium text-foreground">
            {application.casting.pay.amount.toLocaleString()} {application.casting.pay.currency}
          </span>
        )}
      </div>
      {/* Status-specific messages */}
      {application.status === "accepted" && (
        <p className="text-xs text-amber-400 mt-1">Awaiting brand confirmation</p>
      )}
      {application.status === "confirmed" && onOpenCastingRoom && (
        <Button
          size="sm"
          className="w-full mt-2"
          onClick={() => onOpenCastingRoom(application.castingId)}
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Enter Casting Room
        </Button>
      )}
    </Card>
  )
}

function OfferCard({
  offer,
  onUpdate,
}: { offer: JobOffer; onUpdate: (id: string, updates: Partial<JobOffer>) => void }) {
  const handleAccept = () => {
    onUpdate(offer.id, { status: "accepted" })
  }

  const handleDecline = () => {
    onUpdate(offer.id, { status: "declined" })
  }

  return (
    <Card className="p-4 space-y-4 mb-3 border-warning/30 bg-warning/5">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={offer.sender.avatar || "/placeholder.svg"} alt={offer.sender.name} />
          <AvatarFallback>{offer.sender.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{offer.sender.name}</span>
            {offer.sender.verified && <BadgeCheck className="w-4 h-4" />}
          </div>
          <p className="text-xs text-muted-foreground">{formatDistanceToNow(offer.createdAt, { addSuffix: true })}</p>
        </div>
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Offer
        </Badge>
      </div>

      <div>
        <h3 className="font-semibold">{offer.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{offer.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Payment</p>
          <p className="font-medium">
            {offer.pay.amount.toLocaleString()} {offer.pay.currency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Location</p>
          <p className="font-medium">{offer.location}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Dates</p>
          <p className="font-medium">
            {format(offer.dates.start, "MMM d")} - {format(offer.dates.end, "MMM d")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Expires</p>
          <p className="font-medium">{formatDistanceToNow(offer.expiresAt, { addSuffix: true })}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDecline}>
          <X className="w-4 h-4 mr-2" />
          Decline
        </Button>
        <Button className="flex-1" onClick={handleAccept}>
          <Check className="w-4 h-4 mr-2" />
          Accept
        </Button>
      </div>
    </Card>
  )
}
