import type { UserRole } from "./types"
import { Home, Briefcase, Search, MessageSquare, Users } from "lucide-react"

export type TabId = "home" | "castings" | "discover" | "models" | "roster" | "inbox"

export interface NavTab {
  id: TabId
  label: string
  icon: typeof Home
}

export function getNavTabs(role: UserRole): NavTab[] {
  switch (role) {
    case "model":
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "castings", label: "Castings", icon: Briefcase },
        { id: "discover", label: "Discover", icon: Search },
        { id: "inbox", label: "Inbox", icon: MessageSquare },
      ]
    case "agency":
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "models", label: "Scout", icon: Search },
        { id: "castings", label: "Castings", icon: Briefcase },
        { id: "inbox", label: "Inbox", icon: MessageSquare },
      ]
    case "brand":
    case "client":
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "models", label: "Models", icon: Users },
        { id: "castings", label: "Castings", icon: Briefcase },
        { id: "inbox", label: "Inbox", icon: MessageSquare },
      ]
  }
}
