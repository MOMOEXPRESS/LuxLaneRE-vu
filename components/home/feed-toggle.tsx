"use client"

import { motion } from "framer-motion"

interface FeedToggleProps {
  active: "foryou" | "following"
  onChange: (value: "foryou" | "following") => void
}

export function FeedToggle({ active, onChange }: FeedToggleProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 border-b border-border">
      <button
        onClick={() => onChange("foryou")}
        className={`relative text-sm font-medium transition-colors ${
          active === "foryou" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        For You
        {active === "foryou" && (
          <motion.div layoutId="feed-indicator" className="absolute -bottom-3 left-0 right-0 h-0.5 bg-foreground" />
        )}
      </button>
      <button
        onClick={() => onChange("following")}
        className={`relative text-sm font-medium transition-colors ${
          active === "following" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Following
        {active === "following" && (
          <motion.div layoutId="feed-indicator" className="absolute -bottom-3 left-0 right-0 h-0.5 bg-foreground" />
        )}
      </button>
    </div>
  )
}
