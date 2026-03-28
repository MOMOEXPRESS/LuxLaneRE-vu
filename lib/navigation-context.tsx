"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Casting, User, CastingRoom } from "@/lib/types"
import type { TabId } from "@/lib/navigation"

type ViewType =
  | "main"
  | "settings"
  | "own-profile"
  | "profile"
  | "casting"
  | "scoreboard"
  | "verification"
  | "compare"
  | "casting-room"

interface NavigationState {
  view: ViewType
  tab: TabId
  selectedCasting: Casting | null
  selectedProfile: User | null
  compareModels: [User, User] | null
  selectedRoom: CastingRoom | null
}

interface NavigationContextType {
  // Current state
  currentView: ViewType
  activeTab: TabId
  selectedCasting: Casting | null
  selectedProfile: User | null
  compareModels: [User, User] | null
  selectedRoom: CastingRoom | null

  // History
  canGoBack: boolean

  // Navigation methods
  navigateTo: (
    view: ViewType,
    options?: {
      casting?: Casting
      profile?: User
      models?: [User, User]
      room?: CastingRoom
    },
  ) => void
  setActiveTab: (tab: TabId) => void
  goBack: () => void
  goHome: () => void
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<NavigationState[]>([])
  const [currentState, setCurrentState] = useState<NavigationState>({
    view: "main",
    tab: "home",
    selectedCasting: null,
    selectedProfile: null,
    compareModels: null,
    selectedRoom: null,
  })

  const navigateTo = useCallback(
    (
      view: ViewType,
      options?: {
        casting?: Casting
        profile?: User
        models?: [User, User]
        room?: CastingRoom
      },
    ) => {
      // Save current state to history before navigating
      setHistory((prev) => [...prev, currentState])

      setCurrentState((prev) => ({
        ...prev,
        view,
        selectedCasting: options?.casting ?? (view === "casting" ? prev.selectedCasting : null),
        selectedProfile: options?.profile ?? (view === "profile" ? prev.selectedProfile : null),
        compareModels: options?.models ?? (view === "compare" ? prev.compareModels : null),
        selectedRoom: options?.room ?? (view === "casting-room" ? prev.selectedRoom : null),
      }))
    },
    [currentState],
  )

  const setActiveTab = useCallback((tab: TabId) => {
    // Clear history when changing main tabs
    setHistory([])
    setCurrentState((prev) => ({
      ...prev,
      view: "main",
      tab,
      selectedCasting: null,
      selectedProfile: null,
      compareModels: null,
      selectedRoom: null,
    }))
  }, [])

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1]
      setHistory((prev) => prev.slice(0, -1))
      setCurrentState(previousState)
    } else {
      // Fallback to home if no history
      setCurrentState({
        view: "main",
        tab: "home",
        selectedCasting: null,
        selectedProfile: null,
        compareModels: null,
        selectedRoom: null,
      })
    }
  }, [history])

  const goHome = useCallback(() => {
    setHistory([])
    setCurrentState({
      view: "main",
      tab: "home",
      selectedCasting: null,
      selectedProfile: null,
      compareModels: null,
      selectedRoom: null,
    })
  }, [])

  return (
    <NavigationContext.Provider
      value={{
        currentView: currentState.view,
        activeTab: currentState.tab,
        selectedCasting: currentState.selectedCasting,
        selectedProfile: currentState.selectedProfile,
        compareModels: currentState.compareModels,
        selectedRoom: currentState.selectedRoom,
        canGoBack: history.length > 0,
        navigateTo,
        setActiveTab,
        goBack,
        goHome,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}
