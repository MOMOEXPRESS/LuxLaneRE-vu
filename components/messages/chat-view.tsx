"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, MoreHorizontal, Send, ImageIcon, BadgeCheck, Phone, Video } from "lucide-react"
import type { User, Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/mock-data"

interface ChatViewProps {
  otherUser: User
  messages: Message[]
  onBack: () => void
  onSend: (content: string) => void
  onProfileClick: () => void
}

export function ChatView({ otherUser, messages, onBack, onSend, onProfileClick }: ChatViewProps) {
  const currentUser = getCurrentUser()
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (newMessage.trim()) {
      onSend(newMessage.trim())
      setNewMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""

    msgs.forEach((msg) => {
      const dateStr = msg.createdAt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
      if (dateStr !== currentDate) {
        currentDate = dateStr
        groups.push({ date: dateStr, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={onProfileClick} className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full p-[2px]",
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
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">{otherUser.name}</span>
                {otherUser.verified && <BadgeCheck className="h-4 w-4 text-gold fill-gold/20" />}
              </div>
              <span className="text-xs text-muted-foreground capitalize">{otherUser.role}</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50">
            <Phone className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50">
            <Video className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 text-xs text-muted-foreground bg-secondary/50 rounded-full">{group.date}</span>
            </div>

            {/* Messages */}
            {group.messages.map((message, msgIndex) => {
              const isOwn = message.senderId === currentUser.id
              const showAvatar =
                !isOwn &&
                (msgIndex === group.messages.length - 1 || group.messages[msgIndex + 1]?.senderId === currentUser.id)

              return (
                <div key={message.id} className={cn("flex gap-2 mb-2", isOwn ? "justify-end" : "justify-start")}>
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        <img
                          src={otherUser.avatar || "/placeholder.svg"}
                          alt={otherUser.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl",
                      isOwn
                        ? "bg-gold text-primary-foreground rounded-br-md"
                        : "bg-secondary/70 text-foreground rounded-bl-md",
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span
                      className={cn(
                        "text-[10px] mt-1 block",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border/30 bg-background">
        <div className="flex items-center gap-2">
          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary">
            <ImageIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-secondary/50 border-0 rounded-full text-base focus:ring-2 focus:ring-gold outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-full transition-colors",
              newMessage.trim() ? "bg-gold text-primary-foreground" : "bg-secondary/50 text-muted-foreground",
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
