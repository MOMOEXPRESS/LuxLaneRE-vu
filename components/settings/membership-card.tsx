"use client"

import { Check, Crown, Star, Sparkles } from "lucide-react"
import type { MembershipTier } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MembershipCardProps {
  tier: MembershipTier
  isCurrentTier: boolean
  onSelect: () => void
}

const tierConfig = {
  free: {
    name: "Free",
    price: 0,
    icon: Star,
    color: "text-muted-foreground",
    bgColor: "bg-secondary/50",
    borderColor: "border-border/50",
    features: ["Basic profile", "Browse feed", "Send 5 messages/day", "Standard visibility"],
  },
  elite: {
    name: "Elite",
    price: 49,
    icon: Crown,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/50",
    features: [
      "Verified badge",
      "Priority in search",
      "Unlimited messaging",
      "Analytics dashboard",
      "Direct booking requests",
    ],
  },
  black: {
    name: "Black",
    price: 199,
    icon: Sparkles,
    color: "text-foreground",
    bgColor: "bg-foreground/5",
    borderColor: "border-foreground/50",
    features: [
      "Everything in Elite",
      "Exclusive events access",
      "Priority support",
      "Featured profile placement",
      "Early access to new features",
      "White-glove concierge",
    ],
  },
}

export function MembershipCard({ tier, isCurrentTier, onSelect }: MembershipCardProps) {
  const config = tierConfig[tier]
  const Icon = config.icon

  return (
    <button
      onClick={onSelect}
      disabled={isCurrentTier}
      className={cn(
        "w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden",
        config.bgColor,
        config.borderColor,
        isCurrentTier ? "ring-2 ring-gold" : "hover:scale-[1.02]",
      )}
    >
      {isCurrentTier && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-gold text-primary-foreground text-[10px] font-bold rounded">
          CURRENT
        </div>
      )}

      {tier === "black" && (
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: "16px 16px",
            }}
          />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div>
            <h3 className={cn("font-serif text-xl font-medium", config.color)}>{config.name}</h3>
            <p className="text-sm text-muted-foreground">
              {config.price === 0 ? "Free forever" : `$${config.price}/month`}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {config.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className={cn("h-4 w-4 flex-shrink-0", config.color)} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}
