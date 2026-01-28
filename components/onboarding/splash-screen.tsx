"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "tagline" | "exit">("logo")

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("tagline"), 1200)
    const timer2 = setTimeout(() => setPhase("exit"), 2800)
    const timer3 = setTimeout(onComplete, 3400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <LuxlaneLogo size="lg" />
          </motion.div>

          <AnimatePresence>
            {phase === "tagline" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 text-sm tracking-[0.2em] text-muted-foreground uppercase"
              >
                Where Luxury Meets Exclusivity
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 h-[1px] w-32 bg-gradient-to-r from-transparent via-gold to-transparent origin-center"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
