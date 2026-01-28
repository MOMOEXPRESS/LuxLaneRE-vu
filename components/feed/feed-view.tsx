"use client"

import { useState } from "react"
import { FeedHeader } from "./feed-header"
import { StoriesBar } from "./stories-bar"
import { PostCard } from "./post-card"
import { mockPosts, mockUsers, getCurrentUser } from "@/lib/mock-data"

interface FeedViewProps {
  onMessagesClick: () => void
  onProfileClick: (userId: string) => void
}

export function FeedView({ onMessagesClick, onProfileClick }: FeedViewProps) {
  const currentUser = getCurrentUser()
  const [posts, setPosts] = useState(mockPosts)

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post,
      ),
    )
  }

  const handleBookmark = (postId: string) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)))
  }

  return (
    <div className="min-h-screen pb-20">
      <FeedHeader
        unreadMessages={2}
        unreadNotifications={5}
        onMessagesClick={onMessagesClick}
        onNotificationsClick={() => {}}
      />

      <main className="pt-14">
        <StoriesBar
          currentUser={currentUser}
          users={mockUsers.filter((u) => u.id !== currentUser.id)}
          onStoryClick={() => {}}
          onAddStory={() => {}}
        />

        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={() => {}}
              onShare={() => {}}
              onBookmark={handleBookmark}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
