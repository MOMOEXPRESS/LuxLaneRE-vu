"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import type { User, Casting } from "@/lib/types"
import {
  BadgeCheck,
  MapPin,
  Settings,
  Share2,
  Grid3X3,
  Calendar,
  Edit,
  MessageSquare,
  UserPlus,
  Star,
  TrendingUp,
  Scan,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  Globe,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type ProfileTab = "portfolio" | "details" | "availability"

interface ProfileViewProps {
  user?: User
  isOwn?: boolean
  onSettingsClick?: () => void
  onMessageClick?: () => void
  onInviteToCasting?: (casting: Casting) => void
}

export function ProfileView({
  user: profileUser,
  isOwn = true,
  onSettingsClick,
  onMessageClick,
  onInviteToCasting,
}: ProfileViewProps) {
  const { user: currentUser } = useAuth()
  const { castings } = useStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>("portfolio")
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all")
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showInviteSheet, setShowInviteSheet] = useState(false)
  const [twinRotation, setTwinRotation] = useState(0)
  const [twinZoom, setTwinZoom] = useState(1)
  const [twinTab, setTwinTab] = useState<"head" | "body" | "measurements">("head")

  const user = profileUser || currentUser
  const isBrandOrAgency = currentUser?.role === "brand" || currentUser?.role === "agency"

  if (!user) return null

  // Get user's castings for invite
  const myCastings = castings.filter((c) => c.creatorId === currentUser?.id && c.status === "active")

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "portfolio", label: "Portfolio", icon: <Grid3X3 className="w-4 h-4" /> },
    { id: "details", label: "Details", icon: <Briefcase className="w-4 h-4" /> },
    { id: "availability", label: "Availability", icon: <Calendar className="w-4 h-4" /> },
  ]

  const portfolioFilters = ["all", "runway", "editorial", "campaign", "commercial"]

  const getVerificationBadge = () => {
    if (!user.verified) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Unverified
        </Badge>
      )
    }
    if (user.verificationLevel === "luxlane") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <BadgeCheck className="w-3 h-3 mr-1" />
          Luxlane Verified
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <BadgeCheck className="w-3 h-3 mr-1" />
        Agency Verified
      </Badge>
    )
  }

  const allImages = user.portfolio || []

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
    setLightboxImage(allImages[lightboxIndex > 0 ? lightboxIndex - 1 : allImages.length - 1])
  }

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
    setLightboxImage(allImages[lightboxIndex < allImages.length - 1 ? lightboxIndex + 1 : 0])
  }

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="px-4 py-6">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="w-20 h-20 ring-2 ring-border">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full bg-transparent">
              <Share2 className="w-4 h-4" />
            </Button>
            {isOwn && (
              <Button variant="outline" size="icon" className="rounded-full bg-transparent" onClick={onSettingsClick}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Name + Verification */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{user.name}</h1>
            {getVerificationBadge()}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {user.location}
            </p>
          )}
        </div>

        {/* Quick Stats Row - Model Specific */}
        {user.role === "model" && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4">
            {user.measurements?.height && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="font-semibold text-sm">{user.measurements.height}</p>
              </Card>
            )}
            {user.measurements && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">Measurements</p>
                <p className="font-semibold text-sm">
                  {user.measurements.bust}/{user.measurements.waist}/{user.measurements.hips}
                </p>
              </Card>
            )}
            {user.experience && user.experience.length > 0 && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="font-semibold text-sm">{user.experience[0]}</p>
              </Card>
            )}
            {user.score && (
              <Card className="flex-shrink-0 px-3 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Score
                </p>
                <p className="font-semibold text-sm flex items-center gap-1">
                  {user.score}
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Social Stats */}
        <div className="flex gap-6 mt-4">
          <div>
            <p className="font-semibold">{user.followers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div>
            <p className="font-semibold">{user.following.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Actions */}
        {!isOwn && (
          <div className="flex gap-2 mt-4">
            <Button className="flex-1" variant="default">
              <UserPlus className="w-4 h-4 mr-2" />
              Follow
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onMessageClick}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            {isBrandOrAgency && user.role === "model" && (
              <Button variant="outline" onClick={() => setShowInviteSheet(true)}>
                Invite
              </Button>
            )}
          </div>
        )}
        {isOwn && (
          <Button variant="outline" className="w-full mt-4 bg-transparent">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Digital Twin Section - Model Specific */}
      {user.role === "model" && (
        <div className="px-4 pb-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                <h3 className="font-semibold">Digital Twin</h3>
              </div>
              {user.digitalTwin?.status === "complete" ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not Created
                </Badge>
              )}
            </div>

            {user.digitalTwin?.status === "complete" ? (
              <>
                {/* Twin Viewer Tabs */}
                <div className="flex border-b border-border">
                  {(["head", "body", "measurements"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTwinTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        twinTab === tab ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* 3D Viewer Area */}
                {twinTab !== "measurements" && (
                  <div className="relative aspect-square bg-gradient-to-b from-muted/30 to-muted/60">
                    {/* Grid Background */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />

                    {/* 3D Model Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ rotateY: twinRotation }}
                        style={{
                          transformStyle: "preserve-3d",
                          scale: twinZoom,
                        }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className={twinTab === "head" ? "w-40 h-40" : "w-32 h-56"}
                      >
                        <div
                          className={`w-full h-full ${
                            twinTab === "head" ? "rounded-full" : "rounded-lg"
                          } bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border/50 flex items-center justify-center`}
                        >
                          <Scan className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Viewer Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setTwinRotation((r) => r - 45)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setTwinZoom((z) => Math.max(0.5, z - 0.25))}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setTwinZoom((z) => Math.min(2, z + 0.25))}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Measurements Tab */}
                {twinTab === "measurements" && user.digitalTwin?.attributes && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Precise Height</p>
                        <p className="font-semibold">{user.digitalTwin.attributes.preciseHeight}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Chest</p>
                        <p className="font-semibold">{user.digitalTwin.attributes.preciseChest}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Waist</p>
                        <p className="font-semibold">{user.digitalTwin.attributes.preciseWaist}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Hips</p>
                        <p className="font-semibold">{user.digitalTwin.attributes.preciseHips}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Shoulders</p>
                        <p className="font-semibold">{user.digitalTwin.attributes.shoulderWidth}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Arm Length</p>
                        <p className="font-semibold">{user.digitalTwin.attributes.armLength}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Face/Body Attributes */}
                {twinTab === "head" && user.digitalTwin?.attributes && (
                  <div className="p-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Extracted Attributes</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{user.digitalTwin.attributes.faceShape} face</Badge>
                      <Badge variant="secondary">{user.digitalTwin.attributes.skinTone} skin</Badge>
                      <Badge variant="secondary">{user.digitalTwin.attributes.eyeColor} eyes</Badge>
                      <Badge variant="secondary">{user.digitalTwin.attributes.jawline} jawline</Badge>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Scan className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a 3D digital representation for enhanced casting matches
                </p>
                {isOwn && (
                  <Button variant="outline" className="w-full bg-transparent">
                    Create Digital Twin
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tabs Navigation */}
      {user.role === "model" && (
        <>
          <div className="flex border-b border-border sticky top-14 bg-background z-30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "portfolio" && (
              <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Portfolio Filters */}
                <div className="px-4 py-3 flex gap-2 overflow-x-auto">
                  {portfolioFilters.map((filter) => (
                    <Button
                      key={filter}
                      variant={portfolioFilter === filter ? "default" : "outline"}
                      size="sm"
                      className="flex-shrink-0 capitalize"
                      onClick={() => setPortfolioFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>

                {/* Portfolio Grid */}
                <div className="grid grid-cols-3 gap-0.5 p-0.5">
                  {allImages.map((img, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="aspect-[3/4] bg-muted relative group overflow-hidden"
                      onClick={() => {
                        setLightboxImage(img)
                        setLightboxIndex(i)
                      }}
                    >
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Portfolio ${i + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </motion.button>
                  ))}
                  {allImages.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-muted-foreground">No portfolio images yet</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Measurements Card */}
                {user.measurements && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Measurements</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Height</p>
                        <p className="font-medium">{user.measurements.height}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Bust</p>
                        <p className="font-medium">{user.measurements.bust}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Waist</p>
                        <p className="font-medium">{user.measurements.waist}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Hips</p>
                        <p className="font-medium">{user.measurements.hips}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Shoes</p>
                        <p className="font-medium">{user.measurements.shoeSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Dress</p>
                        <p className="font-medium">{user.measurements.dressSize || "—"}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Physical Attributes */}
                {user.measurements && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Physical Attributes</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Hair</p>
                        <p className="font-medium">{user.measurements.hairColor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Eyes</p>
                        <p className="font-medium">{user.measurements.eyeColor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Skin Tone</p>
                        <p className="font-medium">{user.skinTone || "—"}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Languages */}
                {user.languages && user.languages.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.languages.map((lang, i) => (
                        <Badge key={i} variant="secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Experience Tags */}
                {user.experience && user.experience.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Experience</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.experience.map((exp, i) => (
                        <Badge key={i} variant="outline">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Agency */}
                {user.agencyId && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Represented By</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>AG</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Elite Model Management</p>
                        <p className="text-sm text-muted-foreground">New York</p>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === "availability" && (
              <motion.div
                key="availability"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Availability Status */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Current Status</h3>
                    <Badge
                      className={
                        user.availabilityStatus === "available"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : user.availabilityStatus === "hold"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-red-500/10 text-red-600"
                      }
                    >
                      {user.availabilityStatus === "available"
                        ? "Available"
                        : user.availabilityStatus === "hold"
                          ? "On Hold"
                          : "Booked"}
                    </Badge>
                  </div>
                  {isOwn && (
                    <div className="flex gap-2">
                      <Button
                        variant={user.availabilityStatus === "available" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        Available
                      </Button>
                      <Button
                        variant={user.availabilityStatus === "hold" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        On Hold
                      </Button>
                      <Button
                        variant={user.availabilityStatus === "booked" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        Booked
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Mini Calendar */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Upcoming Availability
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() + i)
                      const isAvailable = i !== 2 && i !== 5
                      return (
                        <div
                          key={i}
                          className={`flex-shrink-0 w-12 py-2 rounded-lg text-center ${
                            isAvailable ? "bg-emerald-500/10" : "bg-muted"
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString("en", { weekday: "short" })}
                          </p>
                          <p className="font-semibold">{date.getDate()}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Next available: Tomorrow</span>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <motion.img
              key={lightboxImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage}
              alt="Portfolio"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite to Casting Sheet */}
      <Sheet open={showInviteSheet} onOpenChange={setShowInviteSheet}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Invite to Casting</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {myCastings.length > 0 ? (
              myCastings.map((casting) => (
                <Card
                  key={casting.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    onInviteToCasting?.(casting)
                    setShowInviteSheet(false)
                  }}
                >
                  <h4 className="font-medium">{casting.title}</h4>
                  <p className="text-sm text-muted-foreground">{casting.type}</p>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active castings</p>
                <p className="text-sm">Create a casting first to invite models</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
