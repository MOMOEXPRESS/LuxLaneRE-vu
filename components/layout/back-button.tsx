"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useNavigation } from "@/lib/navigation-context"

interface BackButtonProps {
  fallbackPath?: string
  className?: string
  onBack?: () => void
}

export function BackButton({ className, onBack }: BackButtonProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { canGoBack, goBack, goHome } = useNavigation()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    // On real routes (e.g. /u/username) use browser back so history works
    if (pathname?.startsWith("/u/")) {
      router.back()
      return
    }
    if (canGoBack) {
      goBack()
    } else {
      goHome()
    }
  }

  return (
    <Button variant="ghost" size="icon" className={className} onClick={handleBack}>
      <ArrowLeft className="w-5 h-5" />
    </Button>
  )
}
