"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  Sparkles,
  Scan,
  Database,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { useStore } from "@/lib/store-context"
import { useSettings } from "@/lib/hooks/use-settings"
import type { UserRole, VerificationLevel } from "@/lib/types"

interface SettingsViewProps {
  onBack: () => void
  onOpenVerification?: () => void
  onOpenDigitalTwin?: () => void
}

type SettingsSection = "main" | "account" | "notifications" | "privacy" | "help" | "dev"

export function SettingsView({ onBack, onOpenVerification, onOpenDigitalTwin }: SettingsViewProps) {
  const { user, logout, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { settings: apiSettings, updateSettings } = useSettings()
  const { getCastings, getActiveCastings, getApplications, reseed } = useStore()
  const [section, setSection] = useState<SettingsSection>("main")
  const [notifications, setNotifications] = useState({
    castingAlerts: true,
    messageAlerts: true,
    offerAlerts: true,
    emailDigest: false,
  })

  // Sync theme and notifications from API when settings load
  useEffect(() => {
    if (!apiSettings) return
    if (apiSettings.darkMode !== undefined) {
      setTheme(apiSettings.darkMode ? "dark" : "light")
    }
    const push = apiSettings.pushNotifs ?? apiSettings.notifications?.push ?? true
    const email = apiSettings.emailNotifs ?? apiSettings.notifications?.email ?? false
    setNotifications((prev) => ({
      ...prev,
      castingAlerts: push,
      messageAlerts: push,
      offerAlerts: push,
      emailDigest: email,
    }))
  }, [apiSettings?.userId])

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value)
    updateSettings({ darkMode: value === "dark" }).catch(() => {})
  }

  const handleNotificationToggle = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    if (key === "emailDigest") {
      updateSettings({ emailNotifs: value }).catch(() => {})
    } else {
      updateSettings({ pushNotifs: value }).catch(() => {})
    }
  }

  const handleLogout = () => {
    logout()
    onBack()
  }

  const handleRoleSwitch = (role: UserRole) => {
    updateUser({ role })
  }

  const handleVerificationSwitch = (level: VerificationLevel) => {
    updateUser({
      verificationLevel: level,
      verified: level !== "unverified",
    })
  }

  const simulateBooking = () => {
    if (!user?.metrics) return
    updateUser({
      metrics: {
        ...user.metrics,
        luxlaneScore: Math.min(100, user.metrics.luxlaneScore + 5),
        components: {
          ...user.metrics.components,
          bookings: user.metrics.components.bookings + 1,
        },
        trend: "up" as const,
        trendChange: user.metrics.trendChange + 2,
      },
    })
  }

  const simulateShortlist = () => {
    if (!user?.metrics) return
    updateUser({
      metrics: {
        ...user.metrics,
        luxlaneScore: Math.min(100, user.metrics.luxlaneScore + 2),
        components: {
          ...user.metrics.components,
          shortlists: user.metrics.components.shortlists + 1,
        },
        trend: "up" as const,
        trendChange: user.metrics.trendChange + 1,
      },
    })
  }

  const roles: { value: UserRole; label: string }[] = [
    { value: "model", label: "Model" },
    { value: "agency", label: "Agency" },
    { value: "brand", label: "Brand" },
    { value: "client", label: "Client" },
  ]

  const verificationLevels: { value: VerificationLevel; label: string }[] = [
    { value: "unverified", label: "Unverified" },
    { value: "agency_verified", label: "Agency" },
    { value: "luxlane_verified", label: "Luxlane" },
  ]

  const menuItems = [
    { id: "account" as const, icon: User, label: "Account", description: "Profile and preferences" },
    { id: "notifications" as const, icon: Bell, label: "Notifications", description: "Alerts and updates" },
    { id: "privacy" as const, icon: Shield, label: "Privacy", description: "Visibility and data" },
    { id: "help" as const, icon: HelpCircle, label: "Help", description: "Support and feedback" },
  ]

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ]

  const allCastings = getCastings()
  const activeCastings = getActiveCastings()
  const allApplications = getApplications()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" onClick={section === "main" ? onBack : () => setSection("main")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-semibold">
          {section === "main" && "Settings"}
          {section === "account" && "Account"}
          {section === "notifications" && "Notifications"}
          {section === "privacy" && "Privacy"}
          {section === "help" && "Help"}
          {section === "dev" && "Dev Panel"}
        </h1>
      </header>

      {section === "main" && (
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 mb-6">
            <img
              src={user?.avatar || "/placeholder.svg"}
              alt={user?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-medium">{user?.name || "User"}</h2>
                {user?.verified && <BadgeCheck className="w-4 h-4" />}
              </div>
              <p className="text-sm text-muted-foreground">@{user?.username || "username"}</p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {user?.role}
            </Badge>
          </div>

          {/* Verification & Digital Twin (Model only) */}
          {user?.role === "model" && (
            <div className="space-y-2 mb-6">
              <button
                onClick={onOpenVerification}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user.verificationLevel === "luxlane_verified" ? "bg-emerald-500/10" : "bg-muted"
                  }`}
                >
                  <Shield
                    className={`w-5 h-5 ${
                      user.verificationLevel === "luxlane_verified" ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">Verification</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user.verificationLevel === "luxlane_verified"
                      ? "Luxlane Verified"
                      : user.verificationLevel === "agency_verified"
                        ? "Agency Verified"
                        : "Get verified"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={onOpenDigitalTwin}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user.digitalTwin?.status === "complete" ? "bg-violet-500/10" : "bg-muted"
                  }`}
                >
                  <Scan
                    className={`w-5 h-5 ${
                      user.digitalTwin?.status === "complete" ? "text-violet-500" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">Digital Twin</div>
                  <div className="text-xs text-muted-foreground">
                    {user.digitalTwin?.status === "complete" ? "View your twin" : "Create your 3D twin"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Menu */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )
            })}
          </div>

          {/* Appearance */}
          <div className="mt-8">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Appearance</h3>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                    theme === option.value ? "border-foreground bg-muted/50" : "border-border hover:bg-muted/30"
                  }`}
                >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dev Panel Button */}
          <button
            onClick={() => setSection("dev")}
            className="w-full flex items-center gap-3 p-3 rounded-lg mt-8 border border-dashed border-amber-500/50 hover:bg-amber-500/5 transition-colors"
          >
            <Database className="h-5 w-5 text-amber-500" />
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">Dev Panel</div>
              <div className="text-xs text-muted-foreground">Testing & simulation tools</div>
            </div>
            <Badge className="bg-amber-500/10 text-amber-600 border-0">DEV</Badge>
          </button>

          {/* Logout */}
          <Button onClick={handleLogout} variant="outline" className="w-full mt-6 h-11 bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">Luxlane v2.0.0</p>
        </div>
      )}

      {/* Dev Panel */}
      {section === "dev" && (
        <div className="p-4 space-y-6">
          {/* Role Switcher */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              Switch Role
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleSwitch(role.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    user?.role === role.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Switcher */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Verification Level
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {verificationLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleVerificationSwitch(level.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    user?.verificationLevel === level.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Actions */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Simulate Events
            </h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={simulateBooking}>
                <span className="mr-2">+</span>
                Simulate Booking (+5 score)
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={simulateShortlist}>
                <span className="mr-2">+</span>
                Simulate Shortlist (+2 score)
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <Database className="w-3 h-3" />
              Store Debug
            </h3>
            <Card className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Castings</span>
                  <span className="font-medium">{allCastings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Castings</span>
                  <span className="font-medium text-emerald-500">{activeCastings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Applications</span>
                  <span className="font-medium">{allApplications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Role</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current User ID</span>
                  <span className="font-medium font-mono text-xs">{user?.id}</span>
                </div>
              </div>

              {/* First 5 castings table */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">First 5 Castings</p>
                <div className="space-y-1.5 text-xs">
                  {allCastings.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <span className="font-mono text-muted-foreground">{c.id}</span>
                      <Badge
                        variant="outline"
                        className={c.status === "active" ? "bg-emerald-500/10 text-emerald-600" : ""}
                      >
                        {c.status}
                      </Badge>
                      <span className="truncate flex-1">{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Reseed Button */}
            <Button variant="outline" className="w-full mt-3 bg-transparent border-dashed" onClick={reseed}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reseed Data
            </Button>
          </div>

          {/* Current State */}
          {user?.metrics && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">User Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verification</span>
                  <span className="font-medium capitalize">{user.verificationLevel.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Luxlane Score</span>
                  <span className="font-medium">{user.metrics.luxlaneScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rank</span>
                  <span className="font-medium">#{user.metrics.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bookings</span>
                  <span className="font-medium">{user.metrics.components.bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shortlists</span>
                  <span className="font-medium">{user.metrics.components.shortlists}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Digital Twin</span>
                  <span className="font-medium capitalize">{user.digitalTwin?.status || "None"}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Other sections remain the same */}
      {section === "account" && (
        <div className="p-4 space-y-1">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Edit Profile</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Change Email</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Change Password</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 text-destructive">
            <span className="text-sm">Delete Account</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {section === "notifications" && (
        <div className="p-4 space-y-4">
          {Object.entries(notifications).map(([key, value]) => {
            const labels: Record<string, { title: string; desc: string }> = {
              castingAlerts: { title: "Casting Alerts", desc: "New castings matching your profile" },
              messageAlerts: { title: "Messages", desc: "New messages from brands & agencies" },
              offerAlerts: { title: "Job Offers", desc: "When you receive an offer" },
              emailDigest: { title: "Email Digest", desc: "Weekly summary of activity" },
            }
            return (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{labels[key].title}</p>
                  <p className="text-xs text-muted-foreground">{labels[key].desc}</p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleNotificationToggle(key, checked)}
                />
              </div>
            )
          })}
        </div>
      )}

      {section === "privacy" && (
        <div className="p-4 space-y-1">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Profile Visibility</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">Public</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Blocked Accounts</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Download My Data</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {section === "help" && (
        <div className="p-4 space-y-1">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">FAQ</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Contact Support</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Terms of Service</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <span className="text-sm">Privacy Policy</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  )
}
