"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { TwinViewer3D } from "./twin-viewer-3d"
import type { User, FacialAnalysis, DigitalTwinAttributes } from "@/lib/types"
import {
  X,
  Scan,
  Eye,
  EyeOff,
  Ruler,
  Brain,
} from "lucide-react"

type ViewerTab = "head" | "body" | "analysis"

interface DigitalTwinViewerPageProps {
  user: User
  isOwn: boolean
  onClose: () => void
}

export function DigitalTwinViewerPage({ user, isOwn, onClose }: DigitalTwinViewerPageProps) {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<ViewerTab>("head")
  const [showAnalysis, setShowAnalysis] = useState(false)

  const isBrandOrAgency = currentUser?.role === "brand" || currentUser?.role === "agency"
  const hasFullAccess = isBrandOrAgency || isOwn

  const twin = user.digitalTwin
  const attrs = twin?.attributes
  const analysis = attrs?.analysis

  const tabs: { id: ViewerTab; label: string; icon: React.ReactNode }[] = [
    { id: "head", label: "Head", icon: <Scan className="w-4 h-4" /> },
    { id: "body", label: "Body", icon: <Ruler className="w-4 h-4" /> },
    { id: "analysis", label: "AI Analysis", icon: <Brain className="w-4 h-4" /> },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#08080c] flex flex-col"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-white">{user.name}</h2>
            <p className="text-[11px] text-zinc-500">Digital Twin</p>
          </div>
        </div>

        {hasFullAccess && analysis && (
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full gap-2 text-xs font-mono ${
              showAnalysis
                ? "bg-white/10 text-white border border-white/20"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            {showAnalysis ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            AI Analysis
          </Button>
        )}
      </div>

      {/* Viewer Area with crossfade animation */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab !== "analysis" ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <TwinViewer3D
                user={user}
                mode={activeTab === "head" ? "head" : "body"}
                showAnalysis={showAnalysis}
              />
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <AnalysisFullView analysis={analysis} attrs={attrs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <div className="border-t border-white/5 bg-[#0c0c14]">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function AnalysisFullView({
  analysis,
  attrs,
}: {
  analysis?: FacialAnalysis
  attrs?: DigitalTwinAttributes
}) {
  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No AI analysis available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Overall Scores */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard label="Symmetry" value={analysis.symmetryScore} />
        <ScoreCard label="Golden Ratio" value={analysis.goldenRatioScore} />
        <ScoreCard label="Harmony" value={analysis.overallHarmony} />
      </div>

      {/* Facial Structure */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">
          Facial Structure
        </h4>
        <div className="space-y-3">
          <MetricRow label="Face Shape" value={attrs?.faceShape || "—"} />
          <MetricRow label="Jawline" value={attrs?.jawline || "—"} />
          <MetricRow label="Cheekbones" value={attrs?.cheekbones || "—"} />
          <MetricRow label="Nose Type" value={attrs?.noseType || "—"} />
          <MetricRow label="Lip Shape" value={attrs?.lipShape || "—"} />
          <MetricRow label="Eye Color" value={attrs?.eyeColor || "—"} />
          <MetricRow label="Skin Tone" value={attrs?.skinTone || "—"} />
        </div>
      </div>

      {/* Proportions */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">
          Proportions
        </h4>
        <div className="space-y-3">
          <MetricRow label="Eye Spacing" value={analysis.eyeSpacing} />
          <MetricRow label="Jaw Angle" value={`${analysis.jawAngle}°`} />
          <MetricRow label="Nose Bridge Ratio" value={analysis.noseBridgeRatio.toFixed(2)} />
          <MetricRow label="Lip-to-Face Ratio" value={analysis.lipToFaceRatio.toFixed(2)} />
        </div>
      </div>

      {/* Facial Thirds */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">
          Facial Thirds
        </h4>
        <div className="flex gap-1 h-28 items-end">
          {Object.entries(analysis.facialThirds).map(([key, val]) => (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-mono text-zinc-300">
                {val.toFixed(1)}%
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                className="w-full rounded-t-md"
                style={{
                  background: `linear-gradient(to top, rgba(255,255,255,0.15), rgba(255,255,255,0.03))`,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <span className="text-[10px] text-zinc-500 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Precise Measurements */}
      {attrs && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <h4 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">
            Precise Measurements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <MeasurementCell label="Height" value={attrs.preciseHeight} />
            <MeasurementCell label="Chest" value={attrs.preciseChest} />
            <MeasurementCell label="Waist" value={attrs.preciseWaist} />
            <MeasurementCell label="Hips" value={attrs.preciseHips} />
            <MeasurementCell label="Shoulders" value={attrs.shoulderWidth} />
            <MeasurementCell label="Arm Length" value={attrs.armLength} />
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90
      ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400"
      : value >= 75
        ? "from-white/10 to-white/3 border-white/10 text-white"
        : "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400"

  return (
    <div
      className={`rounded-xl p-3 bg-gradient-to-b border text-center ${color}`}
    >
      <motion.p
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="text-2xl font-bold font-mono"
      >
        {value}
      </motion.p>
      <p className="text-[10px] uppercase tracking-wider mt-1 opacity-60">{label}</p>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <Badge
        variant="secondary"
        className="bg-white/5 text-zinc-300 border-white/10 font-mono text-xs"
      >
        {value}
      </Badge>
    </div>
  )
}

function MeasurementCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 bg-white/3 rounded-lg border border-white/5">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono text-zinc-200 mt-0.5">{value}</p>
    </div>
  )
}
