"use client"

interface FeedToggleProps {
  active: "foryou" | "following"
  onChange: (value: "foryou" | "following") => void
}

export function FeedToggle({ active, onChange }: FeedToggleProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 border-b border-border">
      <button
        onClick={() => onChange("foryou")}
        className={`relative text-sm font-medium transition-colors pb-3 ${
          active === "foryou" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Explore
        <span
          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-foreground transition-opacity duration-200 ${
            active === "foryou" ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
      <button
        onClick={() => onChange("following")}
        className={`relative text-sm font-medium transition-colors pb-3 ${
          active === "following" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Following
        <span
          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-foreground transition-opacity duration-200 ${
            active === "following" ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
    </div>
  )
}
