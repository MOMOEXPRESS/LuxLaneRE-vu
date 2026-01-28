"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigation } from "@/lib/navigation-context"

interface BackButtonProps {
  fallbackPath?: string
  className?: string
}

export function BackButton({ className }: BackButtonProps) {
  const { canGoBack, goBack, goHome } = useNavigation()

  const handleBack = () => {
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
