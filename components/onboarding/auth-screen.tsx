"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, AtSign, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"

interface AuthScreenProps {
  onSuccess: () => void
}

type AuthMode = "choice" | "login" | "signup" | "role"

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: "model", label: "Model", description: "Showcase your portfolio and get booked" },
  { value: "brand", label: "Brand", description: "Find talent for campaigns and shows" },
  { value: "agency", label: "Agency", description: "Manage and promote your roster" },
  { value: "client", label: "Client", description: "Discover and book top talent" },
]

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const { login, signup, isLoading } = useAuth()
  const [mode, setMode] = useState<AuthMode>("choice")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("model")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    username: "",
  })
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    const success = await login(formData.email, formData.password)
    if (success) {
      onSuccess()
    } else {
      setError("Invalid credentials")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password || !formData.name || !formData.username) {
      setError("Please fill in all fields")
      return
    }

    const success = await signup({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      username: formData.username,
      role: selectedRole,
    })

    if (success) {
      onSuccess()
    } else {
      setError("Signup failed")
    }
  }

  const handleRoleSelect = () => {
    setMode("signup")
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          {mode !== "choice" ? (
            <button
              onClick={() => setMode(mode === "signup" ? "role" : "choice")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div />
          )}
          <LuxlaneLogo size="sm" />
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            {mode === "choice" && (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="font-serif text-3xl font-light tracking-wide">Welcome to</h1>
                  <h2 className="font-serif text-3xl font-light tracking-wide text-gold mt-1">Luxlane</h2>
                  <p className="mt-4 text-muted-foreground">The exclusive network for fashion professionals</p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => setMode("role")}
                    className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium"
                  >
                    Create Account
                  </Button>
                  <Button
                    onClick={() => setMode("login")}
                    variant="outline"
                    className="w-full h-14 border-border/50 hover:bg-secondary rounded-full text-base font-medium"
                  >
                    Sign In
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to our <span className="text-gold">Terms of Service</span> and{" "}
                  <span className="text-gold">Privacy Policy</span>
                </p>
              </motion.div>
            )}

            {mode === "role" && (
              <motion.div
                key="role"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="font-serif text-2xl font-light tracking-wide">I am a...</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Select your role to personalize your experience</p>
                </div>

                <div className="space-y-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedRole === role.value
                          ? "bg-gold/10 border border-gold"
                          : "bg-secondary/50 border border-transparent hover:bg-secondary"
                      }`}
                    >
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{role.description}</div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleRoleSelect}
                  className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="font-serif text-2xl font-light tracking-wide">Welcome back</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-14 pl-12 bg-secondary/50 border-0 rounded-xl text-base"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className="h-14 pl-12 pr-12 bg-secondary/50 border-0 rounded-xl text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <button type="button" className="text-sm text-gold hover:underline">
                    Forgot password?
                  </button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </motion.div>
            )}

            {mode === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="font-serif text-2xl font-light tracking-wide">Create your account</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Joining as a <span className="text-gold capitalize">{selectedRole}</span>
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="h-14 pl-12 bg-secondary/50 border-0 rounded-xl text-base"
                      />
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            username: e.target.value.toLowerCase().replace(/\s/g, ""),
                          }))
                        }
                        className="h-14 pl-12 bg-secondary/50 border-0 rounded-xl text-base"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-14 pl-12 bg-secondary/50 border-0 rounded-xl text-base"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className="h-14 pl-12 pr-12 bg-secondary/50 border-0 rounded-xl text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold/90 rounded-full text-base font-medium"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
