"use client"

import { useState, useRef, useCallback } from "react"
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
import type { User } from "@/lib/types"

interface TwinViewer3DProps {
  user: User
  mode: "head" | "body"
  showAnalysis: boolean
}

// Human head silhouette (oval)
const HEAD_RADIUS = "50%"
// Body mode uses a tall rounded rectangle (no clip-path, just border-radius)

export function TwinViewer3D({ user, mode, showAnalysis }: TwinViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastX = useRef(0)
  const [zoom, setZoom] = useState(1)

  const rotateY = useMotionValue(0)
  const smoothRotateY = useSpring(rotateY, { stiffness: 100, damping: 20 })

  const avatar = user.avatar || "/placeholder.svg"
  const polaroids = user.polaroids || []
  const frontImg = avatar
  const sideImg = polaroids[1] || avatar
  const rightImg = polaroids[0] || avatar

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true
      lastX.current = e.clientX
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      const delta = e.clientX - lastX.current
      rotateY.set(rotateY.get() + delta * 0.5)
      lastX.current = e.clientX
    },
    [rotateY],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const analysis = user.digitalTwin?.attributes?.analysis
  const containerSize = mode === "head" ? "w-56 h-56" : "w-48 h-80"
  const translateZ = mode === "head" ? 110 : 90
  const borderRadius = mode === "head" ? "50%" : "24px"

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#08080c] overflow-hidden select-none"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

      {/* 3D Model */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "800px" }}
      >
        <motion.div
          layout
          style={{
            rotateY: smoothRotateY,
            transformStyle: "preserve-3d",
            scale: zoom,
          }}
          transition={{ layout: { type: "spring", stiffness: 80, damping: 18 } }}
          className={containerSize}
        >
          {/* Front face */}
          <motion.div
            layout
            className="absolute inset-0 backface-hidden overflow-hidden"
            style={{ transform: `translateZ(${translateZ}px)` }}
            transition={{ layout: { type: "spring", stiffness: 80, damping: 18 } }}
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden border border-white/10"
              style={{ borderRadius }}
            >
              <img
                src={frontImg}
                alt="Front"
                className="w-full h-full object-cover"
                style={{ objectPosition: mode === "head" ? "center 20%" : "center" }}
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Right face */}
          <motion.div
            layout
            className="absolute inset-0 backface-hidden overflow-hidden"
            style={{ transform: `rotateY(90deg) translateZ(${translateZ}px)` }}
            transition={{ layout: { type: "spring", stiffness: 80, damping: 18 } }}
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden border border-white/8"
              style={{ borderRadius }}
            >
              <img
                src={rightImg}
                alt="Right"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.85)", objectPosition: mode === "head" ? "center 20%" : "center" }}
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Back face */}
          <motion.div
            layout
            className="absolute inset-0 backface-hidden overflow-hidden"
            style={{ transform: `rotateY(180deg) translateZ(${translateZ}px)` }}
            transition={{ layout: { type: "spring", stiffness: 80, damping: 18 } }}
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden border border-white/5"
              style={{ borderRadius }}
            >
              <img
                src={frontImg}
                alt="Back"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.25) grayscale(1) blur(2px)", objectPosition: mode === "head" ? "center 20%" : "center" }}
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Left face */}
          <motion.div
            layout
            className="absolute inset-0 backface-hidden overflow-hidden"
            style={{ transform: `rotateY(-90deg) translateZ(${translateZ}px)` }}
            transition={{ layout: { type: "spring", stiffness: 80, damping: 18 } }}
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden border border-white/8"
              style={{ borderRadius }}
            >
              <img
                src={sideImg}
                alt="Left"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.85)", objectPosition: mode === "head" ? "center 20%" : "center" }}
                draggable={false}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Analysis overlay — minimal, no scan lines */}
      <AnimatePresence>
        {showAnalysis && analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Score callouts */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <ScoreCallout label="Symmetry" value={analysis.symmetryScore} />
              <ScoreCallout label="Golden Ratio" value={analysis.goldenRatioScore} />
              <ScoreCallout label="Harmony" value={analysis.overallHarmony} />
            </div>

            <div className="absolute bottom-14 left-4 z-10 space-y-1">
              <div className="text-[10px] text-zinc-400/70 uppercase tracking-wider font-mono">
                Eye Spacing: {analysis.eyeSpacing}
              </div>
              <div className="text-[10px] text-zinc-400/70 uppercase tracking-wider font-mono">
                Jaw Angle: {analysis.jawAngle}°
              </div>
              <div className="text-[10px] text-zinc-400/70 uppercase tracking-wider font-mono">
                Nose Ratio: {analysis.noseBridgeRatio}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 z-20">
        <button
          type="button"
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          onClick={() => rotateY.set(rotateY.get() - 45)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
        </button>
        <div className="w-px h-4 bg-zinc-700" />
        <button
          type="button"
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
          </svg>
        </button>
      </div>

      {/* Drag hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500 font-mono uppercase tracking-wider z-10">
        Drag to rotate
      </div>
    </div>
  )
}

function ScoreCallout({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90
      ? "text-emerald-400"
      : value >= 75
        ? "text-zinc-200"
        : value >= 60
          ? "text-amber-400"
          : "text-zinc-400"

  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
        {label}
      </span>
      <span className={`text-sm font-bold font-mono ${color}`}>
        {value}
      </span>
    </div>
  )
}
