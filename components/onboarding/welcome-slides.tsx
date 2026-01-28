"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"

interface WelcomeSlidesProps {
  onComplete: () => void
}

const slides = [
  {
    image: "/placeholder.svg?height=600&width=400",
    title: "Discover",
    subtitle: "Elite Talent",
    description: "Connect with the world's most sought-after models, brands, and industry professionals.",
  },
  {
    image: "/placeholder.svg?height=600&width=400",
    title: "Exclusive",
    subtitle: "Opportunities",
    description: "Access private castings, premium bookings, and invitation-only industry events.",
  },
  {
    image: "/placeholder.svg?height=600&width=400",
    title: "Elevate",
    subtitle: "Your Career",
    description: "Build your portfolio, grow your network, and unlock your full potential.",
  },
]

export function WelcomeSlides({ onComplete }: WelcomeSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  const slide = slides[currentSlide]

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Background Image */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img src={slide.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-12 pt-6">
        {/* Logo */}
        <div className="absolute top-6 left-6">
          <LuxlaneLogo size="sm" />
        </div>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>

        {/* Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h2 className="font-serif text-4xl font-light tracking-wide text-foreground">{slide.title}</h2>
            <h3 className="font-serif text-4xl font-light tracking-wide text-gold mt-1">{slide.subtitle}</h3>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xs">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex items-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-gold" : "w-1 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={nextSlide}
          className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium tracking-wide"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
