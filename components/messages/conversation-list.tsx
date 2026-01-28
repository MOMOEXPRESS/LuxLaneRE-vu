"use client"

import { ArrowLeft, Edit, BadgeCheck } from "lucide-react"
import type { Conversation } from "@/lib/types"
import { formatDistanceToNow } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/mock-data"

interface ConversationListProps {
  conversations: Conversation[]
  onConversationClick: (conversationId: string) => void
  onBack: () => void
  onNewMessage: () => void
}

export function ConversationList({ conversations, onConversationClick, onBack, onNewMessage }: ConversationListProps) {
  const currentUser = getCurrentUser()

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== currentUser.id) || conversation.participants[0]
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 border-b border-border/30">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-lg">Messages</h1>
        <button onClick={onNewMessage} className="w-10 h-10 flex items-center justify-center">
          <Edit className="h-5 w-5" />
        </button>
      </header>

      {/* Conversations */}
      <div className="overflow-y-auto h-[calc(100vh-56px)]">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Edit className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-lg">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Start a conversation with models, brands, or clients
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation)
            const hasUnread = conversation.unreadCount > 0

            return (
              <button
                key={conversation.id}
                onClick={() => onConversationClick(conversation.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "relative flex-shrink-0 w-14 h-14 rounded-full p-[2px]",
                    otherUser.verified ? "bg-gradient-to-br from-gold to-gold-muted" : "bg-border",
                  )}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-background">
                    <img
                      src={otherUser.avatar || "/placeholder.svg"}
                      alt={otherUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground">{conversation.unreadCount}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium truncate", hasUnread && "text-foreground")}>{otherUser.name}</span>
                    {otherUser.verified && <BadgeCheck className="h-4 w-4 text-gold fill-gold/20 flex-shrink-0" />}
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate mt-0.5",
                      hasUnread ? "text-foreground font-medium" : "text-muted-foreground",
                    )}
                  >
                    {conversation.lastMessage.senderId === currentUser.id && "You: "}
                    {conversation.lastMessage.content}
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(conversation.lastMessage.createdAt)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
