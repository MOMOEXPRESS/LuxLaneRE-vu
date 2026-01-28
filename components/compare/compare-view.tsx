"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Scan, Shield, BadgeCheck, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { User, Casting } from "@/lib/types"
import { calculateFitScore } from "@/lib/ai-matching"

interface CompareViewProps {
  models: [User, User]
  casting?: Casting
  onBack: () => void
  onViewProfile: (user: User) => void
}

export function CompareView({ models, casting, onBack, onViewProfile }: CompareViewProps) {
  const [model1, model2] = models
  const [showDigitalTwin, setShowDigitalTwin] = useState(false)

  const score1 = casting ? calculateFitScore(model1, casting) : null
  const score2 = casting ? calculateFitScore(model2, casting) : null

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case "luxlane_verified":
        return (
          <Badge variant="secondary" className="text-[10px]">
            <Shield className="w-2.5 h-2.5 mr-0.5" />
            Luxlane
          </Badge>
        )
      case "agency_verified":
        return (
          <Badge variant="secondary" className="text-[10px]">
            <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />
            Agency
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            Unverified
          </Badge>
        )
    }
  }

  const CompareRow = ({
    label,
    value1,
    value2,
    highlight,
  }: { label: string; value1: string | number; value2: string | number; highlight?: boolean }) => (
    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 py-3 border-b border-border last:border-0">
      <div
        className={`text-right ${highlight && score1 && score2 && Number(value1) > Number(value2) ? "font-semibold" : ""}`}
      >
        {value1}
      </div>
      <div className="text-xs text-muted-foreground w-20 text-center">{label}</div>
      <div
        className={`text-left ${highlight && score1 && score2 && Number(value2) > Number(value1) ? "font-semibold" : ""}`}
      >
        {value2}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 flex items-center h-14 px-4 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-semibold">Compare Models</h1>
      </header>

      {/* Model Headers */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {[model1, model2].map((model, i) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className="p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => onViewProfile(model)}
            >
              <Avatar className="w-16 h-16 mx-auto mb-2">
                <AvatarImage src={model.avatar || "/placeholder.svg"} alt={model.name} />
                <AvatarFallback>{model.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm truncate">{model.name}</p>
              <div className="mt-1">{getVerificationBadge(model.verificationLevel)}</div>
              {model.digitalTwin?.status === "complete" && (
                <Badge variant="outline" className="mt-1 text-[10px]">
                  <Scan className="w-2.5 h-2.5 mr-0.5" />
                  Twin
                </Badge>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Fit Scores */}
      {casting && score1 && score2 && (
        <div className="px-4 mb-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-center text-sm">Fit Score for {casting.title}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${score1.total >= score2.total ? "text-emerald-500" : ""}`}>
                  {score1.total}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${score2.total >= score1.total ? "text-emerald-500" : ""}`}>
                  {score2.total}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {(Object.keys(score1.breakdown) as Array<keyof typeof score1.breakdown>).map((key) => (
                <CompareRow
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value1={`${score1.breakdown[key]}%`}
                  value2={`${score2.breakdown[key]}%`}
                  highlight
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Measurements Comparison */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-center text-sm">Measurements</h3>
          <CompareRow
            label="Height"
            value1={model1.measurements?.height || "-"}
            value2={model2.measurements?.height || "-"}
          />
          <CompareRow
            label="Bust"
            value1={model1.measurements?.bust || "-"}
            value2={model2.measurements?.bust || "-"}
          />
          <CompareRow
            label="Waist"
            value1={model1.measurements?.waist || "-"}
            value2={model2.measurements?.waist || "-"}
          />
          <CompareRow
            label="Hips"
            value1={model1.measurements?.hips || "-"}
            value2={model2.measurements?.hips || "-"}
          />
          <CompareRow
            label="Shoes"
            value1={model1.measurements?.shoeSize || "-"}
            value2={model2.measurements?.shoeSize || "-"}
          />
        </Card>
      </div>

      {/* Stats Comparison */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-center text-sm">Performance</h3>
          <CompareRow
            label="Luxlane Score"
            value1={model1.metrics?.luxlaneScore || 0}
            value2={model2.metrics?.luxlaneScore || 0}
            highlight
          />
          <CompareRow
            label="Rank"
            value1={model1.metrics?.rank ? `#${model1.metrics.rank}` : "-"}
            value2={model2.metrics?.rank ? `#${model2.metrics.rank}` : "-"}
          />
          <CompareRow
            label="Bookings"
            value1={model1.metrics?.components.bookings || 0}
            value2={model2.metrics?.components.bookings || 0}
            highlight
          />
          <CompareRow
            label="Shortlists"
            value1={model1.metrics?.components.shortlists || 0}
            value2={model2.metrics?.components.shortlists || 0}
            highlight
          />
          <CompareRow
            label="Reliability"
            value1={`${model1.metrics?.components.reliability || 0}%`}
            value2={`${model2.metrics?.components.reliability || 0}%`}
            highlight
          />
        </Card>
      </div>

      {/* Digital Twin Comparison */}
      {(model1.digitalTwin?.status === "complete" || model2.digitalTwin?.status === "complete") && (
        <div className="px-4">
          <Card className="p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowDigitalTwin(!showDigitalTwin)}
            >
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Scan className="w-4 h-4" />
                Digital Twin Comparison
              </h3>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDigitalTwin ? "rotate-180" : ""}`} />
            </button>

            {showDigitalTwin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="grid grid-cols-2 gap-4 mt-4"
              >
                {[model1, model2].map((model) => (
                  <div key={model.id} className="text-center">
                    {model.digitalTwin?.status === "complete" ? (
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-4xl">🧍</span>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No Twin</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
