"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { ArrowRight, Camera, Briefcase, Building2, User, Check } from "lucide-react"

type Step = "welcome" | "role" | "auth" | "complete"

const roles: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "model",
    label: "Model",
    description: "Find castings and job opportunities",
    icon: <Camera className="w-5 h-5" />,
  },
  {
    value: "brand",
    label: "Brand",
    description: "Post castings and find talent",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    value: "agency",
    label: "Agency",
    description: "Manage talent and castings",
    icon: <Building2 className="w-5 h-5" />,
  },
  { value: "client", label: "Client", description: "Book models for projects", icon: <User className="w-5 h-5" /> },
]

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("welcome")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const { login, signup, isLoading } = useAuth()

  const handleAuth = async () => {
    if (isLogin) {
      const success = await login(email, password)
      if (success) {
        onComplete()
      }
    } else {
      if (!selectedRole) return
      const success = await signup({
        email,
        password,
        name,
        username: name.toLowerCase().replace(/\s+/g, ""),
        role: selectedRole,
      })
      if (success) {
        setStep("complete")
        setTimeout(onComplete, 1500)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-6 max-w-sm"
            >
              <LuxlaneLogo size="lg" />
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">The Fashion Casting Network</h1>
                <p className="text-muted-foreground">
                  Connect with top brands, agencies, and talent. Your next opportunity starts here.
                </p>
              </div>
              <div className="pt-8 space-y-3">
                <Button
                  onClick={() => {
                    setIsLogin(false)
                    setStep("role")
                  }}
                  className="w-full h-12"
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsLogin(true)
                    setStep("auth")
                  }}
                  className="w-full h-12"
                  size="lg"
                >
                  I already have an account
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col px-6 py-12"
          >
            <button onClick={() => setStep("welcome")} className="text-sm text-muted-foreground mb-8">
              Back
            </button>
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">How will you use Luxlane?</h1>
              <p className="text-muted-foreground">Select your primary role</p>
            </div>
            <div className="space-y-3 flex-1">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                    selectedRole === role.value
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${selectedRole === role.value ? "bg-foreground text-background" : "bg-muted"}`}
                  >
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{role.label}</div>
                    <div className="text-sm text-muted-foreground">{role.description}</div>
                  </div>
                  {selectedRole === role.value && <Check className="w-5 h-5 mt-1" />}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep("auth")} disabled={!selectedRole} className="w-full h-12 mt-6" size="lg">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col px-6 py-12"
          >
            <button
              onClick={() => setStep(isLogin ? "welcome" : "role")}
              className="text-sm text-muted-foreground mb-8"
            >
              Back
            </button>
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-muted-foreground">
                {isLogin ? "Enter your credentials to continue" : "Enter your details to get started"}
              </p>
            </div>
            <div className="space-y-4 flex-1">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-12"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-4 mt-6">
              <Button
                onClick={handleAuth}
                disabled={isLoading || !email || !password || (!isLogin && !name)}
                className="w-full h-12"
                size="lg"
              >
                {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    if (!isLogin) {
                      setStep("welcome")
                    }
                  }}
                  className="text-foreground font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-6"
            >
              <Check className="w-8 h-8 text-background" />
            </motion.div>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re all set</h1>
            <p className="text-muted-foreground mt-2">Welcome to Luxlane</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
