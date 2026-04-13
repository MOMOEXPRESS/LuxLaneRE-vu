import type { User, Casting, FitScore, ModelMatch, ModelRequirements } from "./types"
import { mockUsers } from "./mock-data"

// Parse height string to cm
function parseHeightToCm(height: string): number {
  const match = height.match(/(\d+)/)
  return match ? Number.parseInt(match[1]) : 0
}

// Calculate physical match score
function calculatePhysicalMatch(model: User, requirements: ModelRequirements): number {
  if (!model.measurements) return 50

  let score = 70 // Base score

  // Height matching
  if (requirements.heightRangeCm && model.measurements.heightCm) {
    const { min, max } = requirements.heightRangeCm
    const height = model.measurements.heightCm

    if (height >= min && height <= max) {
      score += 30 // Perfect match
    } else if (height >= min - 2 && height <= max + 2) {
      score += 15 // Close match
    } else {
      score -= 20 // Out of range
    }
  }

  return Math.max(0, Math.min(100, score))
}

// Calculate experience match score
function calculateExperienceMatch(model: User, requirements: ModelRequirements): number {
  const modelTags = model.tags || []
  const requiredTags = requirements.tags || []
  const requiredExperience = requirements.experience || []

  if (requiredTags.length === 0 && requiredExperience.length === 0) return 70

  const allRequired = [...new Set([...requiredTags, ...requiredExperience])]
  const matchCount = allRequired.filter((tag) =>
    modelTags.some((mt) => mt.toLowerCase().includes(tag.toLowerCase())),
  ).length

  const matchRatio = matchCount / allRequired.length
  return Math.round(50 + matchRatio * 50)
}

// Calculate reliability score from metrics
function calculateReliability(model: User): number {
  if (!model.metrics?.components) return 50

  const { responseRate, reliability } = model.metrics.components
  return Math.round((responseRate + reliability) / 2)
}

// Calculate brand affinity score
function calculateBrandAffinity(model: User, casting: Casting): number {
  const modelTags = model.tags || []
  const brandTags = casting.creator.tags || []

  if (brandTags.length === 0) return 60

  const matchCount = brandTags.filter((tag) =>
    modelTags.some((mt) => mt.toLowerCase().includes(tag.toLowerCase())),
  ).length

  const matchRatio = matchCount / brandTags.length
  return Math.round(40 + matchRatio * 60)
}

// Calculate momentum score (recent activity)
function calculateMomentum(model: User): number {
  if (!model.metrics) return 50

  const { trend, trendChange, rankTier } = model.metrics

  let score = 50

  if (trend === "up") score += Math.min(30, trendChange * 2)
  if (trend === "down") score -= Math.min(20, trendChange)

  const tierBonus: Record<string, number> = {
    top10: 20,
    top50: 15,
    top100: 10,
    top500: 5,
    rising: 15,
    new: 0,
  }

  score += tierBonus[rankTier] || 0

  return Math.max(0, Math.min(100, score))
}

// Calculate total fit score
export function calculateFitScore(model: User, casting: Casting): FitScore {
  const physical = calculatePhysicalMatch(model, casting.requirements)
  const experience = calculateExperienceMatch(model, casting.requirements)
  const reliability = calculateReliability(model)
  const brandAffinity = calculateBrandAffinity(model, casting)
  const momentum = calculateMomentum(model)

  // Weighted average
  const weights = {
    physical: 0.25,
    experience: 0.25,
    reliability: 0.2,
    brandAffinity: 0.15,
    momentum: 0.15,
  }

  const total = Math.round(
    physical * weights.physical +
      experience * weights.experience +
      reliability * weights.reliability +
      brandAffinity * weights.brandAffinity +
      momentum * weights.momentum,
  )

  return {
    total,
    breakdown: {
      physical,
      experience,
      reliability,
      brandAffinity,
      momentum,
    },
  }
}

// Get top matches for a casting
export function getTopMatchesForCasting(casting: Casting, limit = 10): ModelMatch[] {
  const models = mockUsers.filter((u) => u.role === "model")

  const matches: ModelMatch[] = models.map((model) => ({
    model,
    fitScore: calculateFitScore(model, casting),
  }))

  // Sort by total fit score descending
  matches.sort((a, b) => b.fitScore.total - a.fitScore.total)

  return matches.slice(0, limit)
}

// Get recommended castings for a model
export function getRecommendedCastingsForModel(
  model: User,
  castings: Casting[],
  limit = 5,
): Array<{ casting: Casting; fitScore: FitScore }> {
  const activeCastings = castings.filter((c) => c.status === "active")

  const recommendations = activeCastings.map((casting) => ({
    casting,
    fitScore: calculateFitScore(model, casting),
  }))

  // Sort by fit score descending
  recommendations.sort((a, b) => b.fitScore.total - a.fitScore.total)

  return recommendations.slice(0, limit)
}

// Get best castings for agency roster
export function getBestCastingsForRoster(
  roster: User[],
  castings: Casting[],
  limit = 5,
): Array<{ casting: Casting; avgFitScore: number; topModel: User }> {
  const activeCastings = castings.filter((c) => c.status === "active")

  const recommendations = activeCastings.map((casting) => {
    const scores = roster.map((model) => ({
      model,
      score: calculateFitScore(model, casting).total,
    }))

    scores.sort((a, b) => b.score - a.score)
    const topModel = scores[0]?.model || roster[0]
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length

    return {
      casting,
      avgFitScore: Math.round(avgScore),
      topModel,
    }
  })

  recommendations.sort((a, b) => b.avgFitScore - a.avgFitScore)

  return recommendations.slice(0, limit)
}
