"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Upload, Video, Scan, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CreateTwinFlowProps {
  onBack: () => void
  onComplete: () => void
}

type TwinStep = "intro" | "video" | "photos" | "processing" | "preview" | "complete"

export function CreateTwinFlow({ onBack, onComplete }: CreateTwinFlowProps) {
  const [step, setStep] = useState<TwinStep>("intro")
  const [progress, setProgress] = useState(0)

  const handleVideoUpload = async () => {
    setStep("photos")
  }

  const handlePhotosUpload = async () => {
    setStep("processing")
    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 300))
      setProgress(i)
    }
    setStep("preview")
  }

  const handleApprove = () => {
    setStep("complete")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" onClick={step === "intro" ? onBack : () => setStep("intro")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-semibold">Create Digital Twin</h1>
      </header>

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 mx-auto mb-6 flex items-center justify-center">
                <Scan className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Digital Twin</h2>
              <p className="text-muted-foreground mb-8">
                Create a 3D digital representation for enhanced casting opportunities
              </p>

              <div className="space-y-4 text-left mb-8">
                <Card className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Upload Video</p>
                    <p className="text-xs text-muted-foreground">30-second rotating video</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Capture Photos</p>
                    <p className="text-xs text-muted-foreground">Front, side, and back views</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">AI Processing</p>
                    <p className="text-xs text-muted-foreground">We create your 3D model</p>
                  </div>
                </Card>
              </div>

              <Button className="w-full h-12" onClick={() => setStep("video")}>
                Get Started
              </Button>
            </div>
          </motion.div>
        )}

        {step === "video" && (
          <motion.div
            key="video"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Video className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload Video</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Record a 30-second video rotating slowly in a well-lit area
              </p>

              <Card className="aspect-video mb-6 bg-muted flex items-center justify-center border-dashed border-2">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to upload video</p>
                </div>
              </Card>

              <Button className="w-full h-12" onClick={handleVideoUpload}>
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === "photos" && (
          <motion.div
            key="photos"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Capture Photos</h2>
              <p className="text-sm text-muted-foreground mb-6">Take clear photos from different angles</p>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {["Front", "Left", "Right", "Back", "Top", "Detail"].map((angle) => (
                  <Card
                    key={angle}
                    className="aspect-square flex items-center justify-center border-dashed border-2 cursor-pointer hover:bg-muted/50"
                  >
                    <div className="text-center">
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">{angle}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <Button className="w-full h-12" onClick={handlePhotosUpload}>
                Process Digital Twin
              </Button>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-20 h-20 rounded-full border-4 border-muted border-t-foreground mx-auto mb-6"
              />
              <h2 className="text-xl font-semibold mb-2">Processing</h2>
              <p className="text-sm text-muted-foreground mb-8">Creating your Digital Twin...</p>

              <div className="max-w-xs mx-auto">
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Preview</h2>
              <p className="text-sm text-muted-foreground mb-6">Review your Digital Twin before approving</p>

              <Card className="aspect-square mb-6 bg-gradient-to-b from-muted/50 to-muted flex items-center justify-center">
                <div className="text-center">
                  <span className="text-8xl">🧍</span>
                  <p className="text-sm text-muted-foreground mt-4">3D Preview</p>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button variant="outline" className="h-12 bg-transparent" onClick={() => setStep("photos")}>
                  Retake
                </Button>
                <Button className="h-12" onClick={handleApprove}>
                  Approve
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4"
          >
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-emerald-500 mx-auto mb-6 flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Digital Twin Created!</h2>
              <p className="text-muted-foreground mb-8">Your Digital Twin is now available on your profile</p>

              <Button className="w-full h-12" onClick={onComplete}>
                View on Profile
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
