"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Scan, RotateCcw, ZoomIn, ZoomOut, Upload, CheckCircle2 } from "lucide-react"
import type { User } from "@/lib/types"

interface DigitalTwinSectionProps {
  user: User
  isOwn?: boolean
  onCreateTwin?: () => void
}

export function DigitalTwinSection({ user, isOwn = false, onCreateTwin }: DigitalTwinSectionProps) {
  const [activeTab, setActiveTab] = useState("head")
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)

  const twin = user.digitalTwin

  if (!twin || twin.status !== "complete") {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Scan className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Digital Twin</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {twin?.status === "processing"
              ? "Your Digital Twin is being processed..."
              : twin?.status === "pending"
                ? "Your Digital Twin is pending review"
                : "Create a 3D digital representation of yourself"}
          </p>

          {twin?.status === "processing" && (
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Scan className="w-5 h-5" />
              </motion.div>
              <span className="text-sm">Processing...</span>
            </div>
          )}

          {isOwn && !twin && (
            <Button onClick={onCreateTwin} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Create Digital Twin
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5" />
          <h3 className="font-semibold">Digital Twin</h3>
        </div>
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start rounded-none border-b border-border h-10 p-0 bg-transparent">
          <TabsTrigger
            value="head"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            Head
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            Full Body
          </TabsTrigger>
          <TabsTrigger
            value="measurements"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            Measurements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="head" className="mt-0">
          <div className="relative aspect-square bg-gradient-to-b from-muted/50 to-muted">
            {/* 3D Viewer Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotateY: rotation }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-48 h-48"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/5 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setRotation((r) => r - 45)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Face Attributes */}
          {twin.attributes && (
            <div className="p-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Extracted Attributes</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{twin.attributes.faceShape} face</Badge>
                <Badge variant="secondary">{twin.attributes.skinTone} skin</Badge>
                <Badge variant="secondary">{twin.attributes.eyeColor} eyes</Badge>
                <Badge variant="secondary">{twin.attributes.jawline} jawline</Badge>
                <Badge variant="secondary">{twin.attributes.cheekbones} cheekbones</Badge>
                <Badge variant="secondary">{twin.attributes.lipShape} lips</Badge>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="body" className="mt-0">
          <div className="relative aspect-[3/4] bg-gradient-to-b from-muted/50 to-muted">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotateY: rotation }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-32 h-64"
              >
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/5 flex items-center justify-center">
                  <span className="text-6xl">🧍</span>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setRotation((r) => r - 45)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="measurements" className="mt-0 p-4">
          {twin.attributes && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Precise Measurements</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Height</p>
                  <p className="font-semibold">{twin.attributes.preciseHeight}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Chest</p>
                  <p className="font-semibold">{twin.attributes.preciseChest}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Waist</p>
                  <p className="font-semibold">{twin.attributes.preciseWaist}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Hips</p>
                  <p className="font-semibold">{twin.attributes.preciseHips}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Shoulders</p>
                  <p className="font-semibold">{twin.attributes.shoulderWidth}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Arm Length</p>
                  <p className="font-semibold">{twin.attributes.armLength}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground">Leg Length</p>
                  <p className="font-semibold">{twin.attributes.legLength}</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
