"use client"

import { useState } from "react"
import { X, ImageIcon, Camera, ChevronRight, MapPin, Tag, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface CreatePostViewProps {
  onClose: () => void
  onPost: (data: PostData) => void
}

interface PostData {
  media: string[]
  caption: string
  location: string
  tags: string[]
}

const mockLocations = ["Paris, France", "Milan, Italy", "New York, NY", "Los Angeles, CA", "London, UK", "Monaco"]

export function CreatePostView({ onClose, onPost }: CreatePostViewProps) {
  const [step, setStep] = useState<"media" | "details">("media")
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const handleMediaSelect = () => {
    // Simulate selecting media
    setSelectedMedia(["/placeholder.svg?height=800&width=600"])
    setStep("details")
  }

  const handlePost = () => {
    onPost({
      media: selectedMedia,
      caption,
      location,
      tags,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 border-b border-border/30">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
          <X className="h-6 w-6" />
        </button>
        <h1 className="font-serif text-lg">New Post</h1>
        {step === "details" ? (
          <Button
            onClick={handlePost}
            disabled={!caption.trim()}
            className="bg-gold text-primary-foreground hover:bg-gold/90 rounded-full px-4"
          >
            Share
          </Button>
        ) : (
          <div className="w-16" />
        )}
      </header>

      {step === "media" && (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] px-6">
          <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-2xl font-light mb-2">Create New Post</h2>
          <p className="text-muted-foreground text-center mb-8">Share photos and videos with your network</p>
          <div className="flex gap-4">
            <Button
              onClick={handleMediaSelect}
              variant="outline"
              className="h-14 px-6 rounded-full border-border/50 bg-transparent"
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Gallery
            </Button>
            <Button
              onClick={handleMediaSelect}
              className="h-14 px-6 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full"
            >
              <Camera className="h-5 w-5 mr-2" />
              Camera
            </Button>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="h-[calc(100vh-56px)] overflow-y-auto">
          {/* Media Preview */}
          <div className="aspect-square bg-secondary">
            <img
              src={selectedMedia[0] || "/placeholder.svg"}
              alt="Selected media"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Form */}
          <div className="p-4 space-y-4">
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[120px] bg-secondary/50 border-0 rounded-xl resize-none text-base"
            />

            {/* Location */}
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className={location ? "text-foreground" : "text-muted-foreground"}>
                  {location || "Add location"}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {showLocationPicker && (
              <div className="space-y-2 pl-4">
                {mockLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocation(loc)
                      setShowLocationPicker(false)
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      location === loc ? "bg-gold/20 text-gold" : "hover:bg-secondary/50",
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}

            {/* Tag People */}
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Tag people</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Add Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Add tags (e.g., fashion, runway)"
                  className="flex-1 bg-transparent border-0 p-0 h-auto text-base focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      setTags([...tags, e.currentTarget.value])
                      e.currentTarget.value = ""
                    }
                  }}
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags(tags.filter((_, i) => i !== index))}
                        className="hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
