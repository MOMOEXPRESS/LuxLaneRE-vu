"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Share2, Copy, Check, Link2 } from "lucide-react"

interface ShareProfileProps {
  username: string
  displayName: string
}

export function ShareProfile({ username, displayName }: ShareProfileProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${username}`
    : `/u/${username}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input")
      input.value = profileUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on LuxLane`,
          text: `Check out ${displayName}'s profile on LuxLane`,
          url: profileUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      setOpen(true)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={handleNativeShare}
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Share Profile</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{profileUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button className="w-full" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy Profile Link"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
