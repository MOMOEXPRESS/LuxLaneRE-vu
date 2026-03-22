"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { api } from "@/lib/api-client"
import {
  Camera,
  ImageIcon,
  Video,
  X,
  Send,
  Type,
  Loader2,
  ArrowLeft,
} from "lucide-react"

interface CreateStorySheetProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type StoryStep = "pick" | "preview" | "posting"

export function CreateStorySheet({ open, onClose, onCreated }: CreateStorySheetProps) {
  const [step, setStep] = useState<StoryStep>("pick")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE")
  const [caption, setCaption] = useState("")
  const [showCaption, setShowCaption] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep("pick")
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption("")
    setShowCaption(false)
    setPosting(false)
    setError(null)
    setMediaType("IMAGE")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    if (!isImage && !isVideo) {
      setError("Please select an image or video file")
      return
    }

    // Validate file size (50MB max for video, 10MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large. Max ${isVideo ? "50MB" : "10MB"}`)
      return
    }

    setError(null)
    setSelectedFile(file)
    setMediaType(isVideo ? "VIDEO" : "IMAGE")
    setPreviewUrl(URL.createObjectURL(file))
    setStep("preview")
  }

  const handlePost = async () => {
    if (!selectedFile) return
    setPosting(true)
    setError(null)

    try {
      // Upload the file
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("type", "story")

      const uploadRes = await fetch("/api/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      let mediaUrl: string

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        mediaUrl = uploadData.url
      } else {
        // If upload fails, store locally as data URL
        const reader = new FileReader()
        mediaUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(selectedFile)
        })
      }

      // Create the story
      const res = await api.createStory({
        mediaUrl,
        mediaType: mediaType,
        caption: caption.trim() || undefined,
      })

      if (res.error) {
        setError("Failed to post story. Try again.")
        setPosting(false)
        return
      }

      setPosting(false)
      handleClose()
      onCreated()
    } catch {
      setError("Something went wrong. Try again.")
      setPosting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 rounded-none border-0 bg-black">
        <SheetHeader className="sr-only">
          <SheetTitle>Create Story</SheetTitle>
          <SheetDescription>Upload a photo or video to share as a story</SheetDescription>
        </SheetHeader>
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {step === "pick" && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <button type="button" onClick={handleClose}>
                <X className="w-6 h-6 text-white" />
              </button>
              <h2 className="text-white font-semibold text-lg">New Story</h2>
              <div className="w-6" />
            </div>

            {/* Media picker options */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
              <p className="text-zinc-400 text-sm text-center mb-4">
                Share a moment with your followers
              </p>

              {/* Camera */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Take Photo or Video</p>
                  <p className="text-zinc-400 text-sm">Use your camera</p>
                </div>
              </button>

              {/* Gallery - Photo */}
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*"
                    fileInputRef.current.click()
                  }
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Choose Photo</p>
                  <p className="text-zinc-400 text-sm">Select from gallery</p>
                </div>
              </button>

              {/* Gallery - Video */}
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "video/*"
                    fileInputRef.current.click()
                  }
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Choose Video</p>
                  <p className="text-zinc-400 text-sm">Select from gallery</p>
                </div>
              </button>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </div>
          </div>
        )}

        {step === "preview" && previewUrl && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
              <button type="button" onClick={() => { setStep("pick"); setPreviewUrl(null); setSelectedFile(null) }}>
                <ArrowLeft className="w-6 h-6 text-white drop-shadow-lg" />
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCaption(!showCaption)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showCaption ? "bg-white text-black" : "bg-black/40 text-white backdrop-blur-sm"}`}
                >
                  <Type className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media preview */}
            <div className="flex-1 flex items-center justify-center bg-black relative">
              {mediaType === "IMAGE" ? (
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                />
              )}

              {/* Caption overlay */}
              {showCaption && (
                <div className="absolute bottom-24 left-4 right-4">
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="bg-black/60 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-full px-4 h-12"
                    maxLength={200}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="p-4 pb-8 flex items-center gap-3">
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 rounded-full px-4 h-12"
                maxLength={200}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
              />
              <Button
                onClick={handlePost}
                disabled={posting}
                className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 p-0"
              >
                {posting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center pb-4">{error}</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
