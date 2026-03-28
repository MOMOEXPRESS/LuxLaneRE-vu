"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Upload, Camera, Scan, CheckCircle2, Clock, Shield, AlertCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"

interface VerificationFlowProps {
  onBack: () => void
  onComplete: () => void
}

type VerificationStep = "overview" | "id" | "face" | "body" | "review" | "complete"

export function VerificationFlow({ onBack, onComplete }: VerificationFlowProps) {
  const { user, updateUser } = useAuth()
  const [step, setStep] = useState<VerificationStep>("overview")
  const [idUploaded, setIdUploaded] = useState(false)
  const [faceScanned, setFaceScanned] = useState(false)
  const [bodyScanned, setBodyScanned] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const steps = [
    { id: "id", label: "ID Upload", icon: Upload, completed: idUploaded },
    { id: "face", label: "Face Scan", icon: Camera, completed: faceScanned },
    { id: "body", label: "Body Scan", icon: Scan, completed: bodyScanned },
    { id: "review", label: "Review", icon: Clock, completed: false },
  ]

  const completedSteps = [idUploaded, faceScanned, bodyScanned].filter(Boolean).length
  const progress = (completedSteps / 3) * 100

  const handleIdUpload = async () => {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 1500))
    setIdUploaded(true)
    setIsProcessing(false)
    setStep("face")
  }

  const handleFaceScan = async () => {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setFaceScanned(true)
    setIsProcessing(false)
    setStep("body")
  }

  const handleBodyScan = async () => {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setBodyScanned(true)
    setIsProcessing(false)
    setStep("review")
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 1500))
    updateUser({ verificationLevel: "luxlane_verified", verified: true })
    setStep("complete")
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" onClick={step === "overview" ? onBack : () => setStep("overview")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-semibold">Verification</h1>
      </header>

      <AnimatePresence mode="wait">
        {step === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {/* Current Status */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    user?.verificationLevel === "luxlane_verified"
                      ? "bg-emerald-500/10"
                      : user?.verificationLevel === "agency_verified"
                        ? "bg-sky-500/10"
                        : "bg-muted"
                  }`}
                >
                  <Shield
                    className={`w-6 h-6 ${
                      user?.verificationLevel === "luxlane_verified"
                        ? "text-emerald-500"
                        : user?.verificationLevel === "agency_verified"
                          ? "text-sky-500"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <p className="font-semibold capitalize">
                    {user?.verificationLevel === "luxlane_verified"
                      ? "Luxlane Verified"
                      : user?.verificationLevel === "agency_verified"
                        ? "Agency Verified"
                        : "Unverified"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Progress */}
            {completedSteps > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completedSteps}/3 steps</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2 mb-6">
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <Card
                    key={s.id}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      s.completed ? "bg-emerald-500/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => !s.completed && setStep(s.id as VerificationStep)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        s.completed ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      {s.completed ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.completed ? "Completed" : `Step ${i + 1}`}</p>
                    </div>
                    {!s.completed && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </Card>
                )
              })}
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-semibold mb-3">Why Verify?</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Higher visibility in casting searches</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Access to verified-only castings</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Trusted badge on your profile</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlock premium casting features</span>
                </div>
              </div>
            </div>

            {completedSteps === 3 && (
              <Button className="w-full mt-6 h-12" onClick={() => setStep("review")}>
                Submit for Review
              </Button>
            )}
          </motion.div>
        )}

        {step === "id" && (
          <motion.div
            key="id"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload ID Document</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Upload a clear photo of your passport or government ID
              </p>

              <Card className="p-8 border-dashed border-2 mb-4">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to upload</p>
              </Card>

              <div className="flex gap-3 text-xs text-muted-foreground mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-left">
                  Your ID is securely encrypted and only used for verification purposes.
                </span>
              </div>

              <Button className="w-full h-12" onClick={handleIdUpload} disabled={isProcessing}>
                {isProcessing ? "Uploading..." : "Upload & Continue"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "face" && (
          <motion.div
            key="face"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Face Scan</h2>
              <p className="text-sm text-muted-foreground mb-8">We'll capture your face to verify your identity</p>

              <Card className="aspect-square max-w-xs mx-auto mb-6 bg-muted flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-foreground/20 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              </Card>

              <Button className="w-full h-12" onClick={handleFaceScan} disabled={isProcessing}>
                {isProcessing ? "Scanning..." : "Start Face Scan"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "body" && (
          <motion.div
            key="body"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Scan className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Body Scan</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Stand 2 meters away and rotate slowly for a full body scan
              </p>

              <Card className="aspect-[3/4] max-w-xs mx-auto mb-6 bg-muted flex items-center justify-center">
                <div className="w-32 h-64 border-2 border-dashed border-foreground/20 rounded-lg flex items-center justify-center">
                  <Scan className="w-12 h-12 text-muted-foreground" />
                </div>
              </Card>

              <Button className="w-full h-12" onClick={handleBodyScan} disabled={isProcessing}>
                {isProcessing ? "Scanning..." : "Start Body Scan"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ready for Review</h2>
              <p className="text-sm text-muted-foreground mb-8">
                All steps completed. Submit your verification for review.
              </p>

              <div className="space-y-2 mb-8">
                {steps.slice(0, 3).map((s) => {
                  const Icon = s.icon
                  return (
                    <Card key={s.id} className="p-3 flex items-center gap-3 bg-emerald-500/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm">{s.label}</span>
                    </Card>
                  )
                })}
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                Verification typically takes 24-48 hours. You'll receive a notification when complete.
              </p>

              <Button className="w-full h-12" onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? "Submitting..." : "Submit for Review"}
              </Button>
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
              <h2 className="text-2xl font-semibold mb-2">Verified!</h2>
              <p className="text-muted-foreground mb-8">
                Your account has been verified. You now have access to all premium features.
              </p>

              <Badge className="bg-emerald-500 text-white mb-8">
                <Shield className="w-3 h-3 mr-1" />
                Luxlane Verified
              </Badge>

              <Button className="w-full h-12" onClick={onComplete}>
                Continue
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
