"use client"

import { useState } from "react"
import { ConversationList } from "./conversation-list"
import { ChatView } from "./chat-view"
import { mockConversations, mockMessages, getCurrentUser } from "@/lib/mock-data"
import type { Message } from "@/lib/types"

interface MessagesViewProps {
  onClose: () => void
  onProfileClick: (userId: string) => void
}

export function MessagesView({ onClose, onProfileClick }: MessagesViewProps) {
  const currentUser = getCurrentUser()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>(mockMessages)

  const conversation = selectedConversation ? mockConversations.find((c) => c.id === selectedConversation) : null

  const otherUser = conversation
    ? conversation.participants.find((p) => p.id !== currentUser.id) || conversation.participants[0]
    : null

  const conversationMessages = messages.filter((m) => m.conversationId === selectedConversation)

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation!,
      senderId: currentUser.id,
      content,
      read: true,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  if (selectedConversation && otherUser) {
    return (
      <ChatView
        otherUser={otherUser}
        messages={conversationMessages}
        onBack={() => setSelectedConversation(null)}
        onSend={handleSendMessage}
        onProfileClick={() => onProfileClick(otherUser.id)}
      />
    )
  }

  return (
    <ConversationList
      conversations={mockConversations}
      onConversationClick={setSelectedConversation}
      onBack={onClose}
      onNewMessage={() => {}}
    />
  )
}
