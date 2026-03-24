"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Casting, CastingApplication, User, Notification, JobOffer } from "./types"
import { api } from "./api-client"

export function normalizeStatus<T extends string>(s: T): T {
  return s.toLowerCase().trim() as T
}

// Convert API casting to frontend Casting type
function apiCastingToFrontend(c: Record<string, any>): Casting {
  return {
    id: c.id,
    creatorId: c.createdBy || c.creatorId,
    creator: {
      id: c.creator?.id || c.createdBy,
      name: c.creator?.displayName || c.creator?.username || "Unknown",
      username: c.creator?.username || "",
      avatar: c.creator?.avatarUrl || c.creator?.avatar || "/placeholder.svg",
      role: (c.creator?.role || "brand").toLowerCase() as any,
      email: "",
      verified: c.creator?.verified || false,
      verificationLevel: "unverified" as const,
      bio: "",
      location: "",
      followers: 0,
      following: 0,
      createdAt: new Date(),
    },
    title: c.title,
    type: (c.type || "campaign").toLowerCase(),
    description: c.description || "",
    location: c.location || "",
    dates: {
      start: new Date(c.startDate || c.dates?.start || Date.now()),
      end: new Date(c.endDate || c.dates?.end || Date.now()),
    },
    pay: {
      amount: c.payMin || c.pay?.amount || 0,
      currency: c.currency || c.pay?.currency || "EUR",
      type: c.payMin === c.payMax ? "flat" : c.payMin ? "flat" : "tbd",
    },
    requirements: c.requirements || {},
    deadline: c.deadline ? new Date(c.deadline) : new Date(Date.now() + 30 * 86400000),
    status: normalizeStatus(c.status || "active"),
    applicationsCount: c.applicationsCount ?? c._count?.submissions ?? 0,
    shortlistedCount: c.shortlistedCount ?? 0,
    createdAt: new Date(c.createdAt || Date.now()),
    images: c.images || [],
    settings: c.settings || {},
    roomId: c.roomId,
  }
}

interface StoreState {
  castings: Casting[]
  applications: CastingApplication[]
  users: User[]
  notifications: Notification[]
  offers: JobOffer[]
  castingsLoaded: boolean
}

interface StoreContextValue extends StoreState {
  // Getters
  getCastings: () => Casting[]
  getActiveCastings: () => Casting[]
  getCastingsForCreator: (creatorId: string) => Casting[]
  getCasting: (id: string) => Casting | undefined
  getApplications: () => CastingApplication[]
  getApplicationsForModel: (modelId: string) => CastingApplication[]
  getApplicationsForCasting: (castingId: string) => CastingApplication[]
  getUsers: () => User[]
  getUser: (id: string) => User | undefined
  getNotificationsForUser: (userId: string) => Notification[]
  getUnreadNotificationsCount: (userId: string) => number
  getOffersForModel: (modelId: string) => JobOffer[]
  getPendingOffersForModel: (modelId: string) => JobOffer[]

  // Mutators
  addCasting: (casting: Casting) => void
  updateCasting: (id: string, updates: Partial<Casting>) => void
  addApplication: (application: CastingApplication) => void
  updateApplication: (id: string, updates: Partial<CastingApplication>) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
  addOffer: (offer: JobOffer) => void
  updateOffer: (id: string, updates: Partial<JobOffer>) => void

  // Utils
  reseed: () => void
  refreshCastings: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    castings: [],
    applications: [],
    users: [],
    notifications: [],
    offers: [],
    castingsLoaded: false,
  })

  // Load castings on mount + reload every 30s to stay fresh
  useEffect(() => {
    loadCastings()
    loadApplications()
    const interval = setInterval(() => {
      loadCastings()
      loadApplications()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadCastings() {
    try {
      const res = await api.getCastings({ status: "ACTIVE", limit: 50 })
      const data = res.data as { castings?: Record<string, any>[] } | undefined
      if (data?.castings && Array.isArray(data.castings)) {
        const castings = data.castings.map(apiCastingToFrontend)
        setState((prev) => ({ ...prev, castings, castingsLoaded: true }))
      } else {
        setState((prev) => ({ ...prev, castingsLoaded: true }))
      }
    } catch {
      setState((prev) => ({ ...prev, castingsLoaded: true }))
    }
  }

  async function loadApplications() {
    try {
      const res = await api.getJobHistory()
      const data = res.data as { submissions?: Record<string, any>[] } | undefined
      if (data?.submissions && Array.isArray(data.submissions)) {
        const applications: CastingApplication[] = data.submissions.map((s: Record<string, any>) => ({
          id: s.id,
          castingId: s.castingId,
          casting: s.casting ? apiCastingToFrontend(s.casting) : undefined,
          modelId: s.modelId,
          model: {
            id: s.model?.id || s.modelId,
            name: s.model?.displayName || s.model?.username || "Model",
            username: s.model?.username || "",
            avatar: s.model?.avatarUrl || "/placeholder.svg",
            role: "model" as const,
            email: "",
            verified: false,
            verificationLevel: "unverified" as const,
            bio: "",
            location: "",
            followers: 0,
            following: 0,
            createdAt: new Date(),
          },
          status: (s.status || "applied").toLowerCase(),
          message: s.note || "",
          submittedAt: new Date(s.createdAt || Date.now()),
          updatedAt: new Date(s.updatedAt || Date.now()),
        }))
        setState((prev) => ({ ...prev, applications }))
      }
    } catch {
      // silently fail — no submissions yet
    }
  }

  const refreshCastings = useCallback(async () => {
    await loadCastings()
    await loadApplications()
  }, [])

  // Getters
  const getCastings = useCallback(() => state.castings, [state.castings])

  const getActiveCastings = useCallback(() => {
    return state.castings.filter((c) => normalizeStatus(c.status) === "active")
  }, [state.castings])

  const getCastingsForCreator = useCallback(
    (creatorId: string) => {
      return state.castings.filter((c) => c.creatorId === creatorId)
    },
    [state.castings],
  )

  const getCasting = useCallback(
    (id: string) => {
      return state.castings.find((c) => c.id === id)
    },
    [state.castings],
  )

  const getApplications = useCallback(() => state.applications, [state.applications])

  const getApplicationsForModel = useCallback(
    (modelId: string) => {
      return state.applications.filter((a) => a.modelId === modelId)
    },
    [state.applications],
  )

  const getApplicationsForCasting = useCallback(
    (castingId: string) => {
      return state.applications.filter((a) => a.castingId === castingId)
    },
    [state.applications],
  )

  const getUsers = useCallback(() => state.users, [state.users])

  const getUser = useCallback(
    (id: string) => {
      return state.users.find((u) => u.id === id)
    },
    [state.users],
  )

  const getNotificationsForUser = useCallback(
    (userId: string) => {
      return state.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    [state.notifications],
  )

  const getUnreadNotificationsCount = useCallback(
    (userId: string) => {
      return state.notifications.filter((n) => n.userId === userId && !n.read).length
    },
    [state.notifications],
  )

  const getOffersForModel = useCallback(
    (modelId: string) => {
      return state.offers.filter((o) => o.modelId === modelId)
    },
    [state.offers],
  )

  const getPendingOffersForModel = useCallback(
    (modelId: string) => {
      return state.offers.filter((o) => o.modelId === modelId && o.status === "pending")
    },
    [state.offers],
  )

  // Mutators
  const addCasting = useCallback((casting: Casting) => {
    setState((prev) => ({
      ...prev,
      castings: [casting, ...prev.castings],
    }))
  }, [])

  const updateCasting = useCallback((id: string, updates: Partial<Casting>) => {
    setState((prev) => ({
      ...prev,
      castings: prev.castings.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }, [])

  const addApplication = useCallback((application: CastingApplication) => {
    setState((prev) => ({
      ...prev,
      applications: [application, ...prev.applications],
    }))
  }, [])

  const updateApplication = useCallback((id: string, updates: Partial<CastingApplication>) => {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }))
  }, [])

  const addNotification = useCallback((notification: Notification) => {
    setState((prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
    }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])

  const markAllNotificationsRead = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
    }))
  }, [])

  const addOffer = useCallback((offer: JobOffer) => {
    setState((prev) => ({
      ...prev,
      offers: [offer, ...prev.offers],
    }))
  }, [])

  const updateOffer = useCallback((id: string, updates: Partial<JobOffer>) => {
    setState((prev) => ({
      ...prev,
      offers: prev.offers.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }))
  }, [])

  // Reseed — reload from DB
  const reseed = useCallback(() => {
    loadCastings()
  }, [])

  const value: StoreContextValue = {
    ...state,
    getCastings,
    getActiveCastings,
    getCastingsForCreator,
    getCasting,
    getApplications,
    getApplicationsForModel,
    getApplicationsForCasting,
    getUsers,
    getUser,
    getNotificationsForUser,
    getUnreadNotificationsCount,
    getOffersForModel,
    getPendingOffersForModel,
    addCasting,
    updateCasting,
    addApplication,
    updateApplication,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    addOffer,
    updateOffer,
    reseed,
    refreshCastings,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
