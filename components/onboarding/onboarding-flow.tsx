"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LuxlaneLogo } from "@/components/ui/luxlane-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import type { UserRole } from "@/lib/types"
import { ArrowRight, Camera, Briefcase, Building2, User, Check } from "lucide-react"

type Step = "welcome" | "role" | "auth" | "profile" | "complete"

interface ProfileData {
  location: string
  bio: string
  height: string
  bust: string
  waist: string
  hips: string
  shoeSize: string
  hairColor: string
  eyeColor: string
  languages: string
  experienceTags: string
  instagram: string
  tiktok: string
  companyName: string
  website: string
  industry: string
}

const emptyProfileData: ProfileData = {
  location: "",
  bio: "",
  height: "",
  bust: "",
  waist: "",
  hips: "",
  shoeSize: "",
  hairColor: "",
  eyeColor: "",
  languages: "",
  experienceTags: "",
  instagram: "",
  tiktok: "",
  companyName: "",
  website: "",
  industry: "",
}

const hairColors = ["Black", "Brown", "Blonde", "Red", "Auburn", "Gray", "White", "Other"]
const eyeColors = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Other"]
const industries = ["Fashion", "Beauty", "Tech", "Entertainment", "Sports", "Retail", "Hospitality", "Other"]

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
    description: "Ongoing casting & talent management",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    value: "agency",
    label: "Agency",
    description: "Manage talent and castings",
    icon: <Building2 className="w-5 h-5" />,
  },
  { value: "client", label: "Client", description: "One-time projects & events", icon: <User className="w-5 h-5" /> },
]

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("welcome")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [authError, setAuthError] = useState("")
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfileData)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const { login, signup, isLoading } = useAuth()

  const updateProfile = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAuth = async () => {
    setAuthError("")
    if (isLogin) {
      const result = await login(email, password)
      if (result.success) {
        onComplete()
      } else {
        setAuthError(result.error ?? "Invalid credentials")
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
        setStep("profile")
      } else {
        setAuthError("Signup failed")
      }
    }
  }

  const handleProfileSubmit = async () => {
    setProfileSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        displayName: name,
        bio: profileData.bio || undefined,
        location: profileData.location || undefined,
      }

      if (selectedRole === "model") {
        payload.modelProfile = {
          heightCm: profileData.height ? parseInt(profileData.height) : undefined,
          bustCm: profileData.bust ? parseInt(profileData.bust) : undefined,
          waistCm: profileData.waist ? parseInt(profileData.waist) : undefined,
          hipsCm: profileData.hips ? parseInt(profileData.hips) : undefined,
          shoeSize: profileData.shoeSize || undefined,
          eyeColor: profileData.eyeColor || undefined,
          hairColor: profileData.hairColor || undefined,
          languages: profileData.languages
            ? profileData.languages.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          experienceTags: profileData.experienceTags
            ? profileData.experienceTags.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          socialLinks: {
            instagram: profileData.instagram || undefined,
            tiktok: profileData.tiktok || undefined,
          },
        }
      } else if (selectedRole === "brand") {
        payload.brandProfile = {
          brandName: profileData.companyName || undefined,
          website: profileData.website || undefined,
        }
      } else if (selectedRole === "agency") {
        payload.agencyProfile = {
          agencyName: profileData.companyName || undefined,
          website: profileData.website || undefined,
        }
      } else if (selectedRole === "client") {
        payload.clientProfile = {
          clientName: profileData.companyName || undefined,
          website: profileData.website || undefined,
          industry: profileData.industry || undefined,
        }
      }

      await api.completeOnboarding(payload)
      setStep("complete")
      setTimeout(onComplete, 1500)
    } catch {
      // Silently proceed on error — profile can be completed later
      setStep("complete")
      setTimeout(onComplete, 1500)
    } finally {
      setProfileSubmitting(false)
    }
  }

  const renderModelProfileForm = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="profile-location">Location</Label>
        <Input
          id="profile-location"
          value={profileData.location}
          onChange={(e) => updateProfile("location", e.target.value)}
          placeholder="e.g. Paris, France"
          className="h-12"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          value={profileData.bio}
          onChange={(e) => updateProfile("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          rows={3}
        />
      </div>

      {/* Measurements */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Measurements</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="height" className="text-xs text-muted-foreground">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={profileData.height}
              onChange={(e) => updateProfile("height", e.target.value)}
              placeholder="175"
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bust" className="text-xs text-muted-foreground">Bust (cm)</Label>
            <Input
              id="bust"
              type="number"
              value={profileData.bust}
              onChange={(e) => updateProfile("bust", e.target.value)}
              placeholder="86"
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="waist" className="text-xs text-muted-foreground">Waist (cm)</Label>
            <Input
              id="waist"
              type="number"
              value={profileData.waist}
              onChange={(e) => updateProfile("waist", e.target.value)}
              placeholder="61"
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hips" className="text-xs text-muted-foreground">Hips (cm)</Label>
            <Input
              id="hips"
              type="number"
              value={profileData.hips}
              onChange={(e) => updateProfile("hips", e.target.value)}
              placeholder="89"
              className="h-10"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="shoeSize" className="text-xs text-muted-foreground">Shoe Size</Label>
          <Input
            id="shoeSize"
            value={profileData.shoeSize}
            onChange={(e) => updateProfile("shoeSize", e.target.value)}
            placeholder="e.g. EU 39"
            className="h-10"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Appearance</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="hairColor" className="text-xs text-muted-foreground">Hair Color</Label>
            <Select value={profileData.hairColor} onValueChange={(v) => updateProfile("hairColor", v)}>
              <SelectTrigger id="hairColor" className="h-10">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {hairColors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="eyeColor" className="text-xs text-muted-foreground">Eye Color</Label>
            <Select value={profileData.eyeColor} onValueChange={(v) => updateProfile("eyeColor", v)}>
              <SelectTrigger id="eyeColor" className="h-10">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {eyeColors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label htmlFor="languages">Languages</Label>
        <Input
          id="languages"
          value={profileData.languages}
          onChange={(e) => updateProfile("languages", e.target.value)}
          placeholder="English, French, Spanish"
          className="h-12"
        />
        <p className="text-xs text-muted-foreground">Comma-separated</p>
      </div>

      {/* Experience Tags */}
      <div className="space-y-2">
        <Label htmlFor="experienceTags">Experience</Label>
        <Input
          id="experienceTags"
          value={profileData.experienceTags}
          onChange={(e) => updateProfile("experienceTags", e.target.value)}
          placeholder="runway, editorial, commercial"
          className="h-12"
        />
        <p className="text-xs text-muted-foreground">Comma-separated tags</p>
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Social Links</Label>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="instagram"
                value={profileData.instagram}
                onChange={(e) => updateProfile("instagram", e.target.value)}
                placeholder="username"
                className="h-10 pl-7"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="tiktok" className="text-xs text-muted-foreground">TikTok</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="tiktok"
                value={profileData.tiktok}
                onChange={(e) => updateProfile("tiktok", e.target.value)}
                placeholder="username"
                className="h-10 pl-7"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBrandProfileForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company / Brand Name</Label>
        <Input
          id="companyName"
          value={profileData.companyName}
          onChange={(e) => updateProfile("companyName", e.target.value)}
          placeholder="Your brand name"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={profileData.website}
          onChange={(e) => updateProfile("website", e.target.value)}
          placeholder="https://yourbrand.com"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-location">Location</Label>
        <Input
          id="profile-location"
          value={profileData.location}
          onChange={(e) => updateProfile("location", e.target.value)}
          placeholder="e.g. New York, NY"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio / Description</Label>
        <Textarea
          id="profile-bio"
          value={profileData.bio}
          onChange={(e) => updateProfile("bio", e.target.value)}
          placeholder="Tell us about your brand..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderAgencyProfileForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Agency Name</Label>
        <Input
          id="companyName"
          value={profileData.companyName}
          onChange={(e) => updateProfile("companyName", e.target.value)}
          placeholder="Your agency name"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={profileData.website}
          onChange={(e) => updateProfile("website", e.target.value)}
          placeholder="https://youragency.com"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-location">Location</Label>
        <Input
          id="profile-location"
          value={profileData.location}
          onChange={(e) => updateProfile("location", e.target.value)}
          placeholder="e.g. London, UK"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio / Description</Label>
        <Textarea
          id="profile-bio"
          value={profileData.bio}
          onChange={(e) => updateProfile("bio", e.target.value)}
          placeholder="Tell us about your agency..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderClientProfileForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={profileData.companyName}
          onChange={(e) => updateProfile("companyName", e.target.value)}
          placeholder="Your company name"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Select value={profileData.industry} onValueChange={(v) => updateProfile("industry", v)}>
          <SelectTrigger id="industry" className="h-12">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={profileData.website}
          onChange={(e) => updateProfile("website", e.target.value)}
          placeholder="https://yourcompany.com"
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-location">Location</Label>
        <Input
          id="profile-location"
          value={profileData.location}
          onChange={(e) => updateProfile("location", e.target.value)}
          placeholder="e.g. Los Angeles, CA"
          className="h-12"
        />
      </div>
    </div>
  )

  const profileTitle: Record<UserRole, string> = {
    model: "Build your model profile",
    brand: "Set up your brand",
    agency: "Set up your agency",
    client: "Tell us about your company",
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
              {authError && (
                <p className="text-sm text-destructive" role="alert">
                  {authError}
                </p>
              )}
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
              {!isLogin && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  By signing up, you agree to our{" "}
                  <a href="/terms" className="underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline">Privacy Policy</a>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {step === "profile" && selectedRole && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col px-6 py-12"
          >
            <button onClick={() => setStep("auth")} className="text-sm text-muted-foreground mb-8">
              Back
            </button>
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">{profileTitle[selectedRole]}</h1>
              <p className="text-muted-foreground">
                Add details to help others find and connect with you
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              {selectedRole === "model" && renderModelProfileForm()}
              {selectedRole === "brand" && renderBrandProfileForm()}
              {selectedRole === "agency" && renderAgencyProfileForm()}
              {selectedRole === "client" && renderClientProfileForm()}
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleProfileSubmit}
                disabled={profileSubmitting}
                className="w-full h-12"
                size="lg"
              >
                {profileSubmitting ? "Saving..." : "Complete Profile"}
              </Button>
              <button
                onClick={() => {
                  setStep("complete")
                  setTimeout(onComplete, 1500)
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Skip for now
              </button>
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
