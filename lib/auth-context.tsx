"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { mockUsers } from "./mock-data"
import { api } from "./api-client"

// Set to false to use real database APIs
const USE_MOCK_DATA = false

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
}

interface SignupData {
  email: string
  password: string
  name: string
  username: string
  role: UserRole
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to convert API user to frontend User type
function apiUserToUser(apiUser: Record<string, unknown>): User {
  return {
    id: apiUser.id as string,
    email: apiUser.email as string,
    name: (apiUser.displayName as string) || (apiUser.display_name as string) || "",
    username: (apiUser.username as string) || "",
    role: apiUser.role as UserRole,
    verified: (apiUser.isVerified as boolean) || (apiUser.is_verified as boolean) || false,
    avatar: (apiUser.avatarUrl as string) || (apiUser.avatar_url as string) || "/placeholder.svg?height=400&width=400",
    bio: (apiUser.bio as string) || "",
    location: (apiUser.location as string) || "",
    followers: 0,
    following: 0,
    createdAt: new Date((apiUser.createdAt as string) || (apiUser.created_at as string) || Date.now()),
    verificationLevel: ((apiUser.isVerified as boolean) || (apiUser.is_verified as boolean) ? "luxlane_verified" : "unverified") as import("./types").VerificationLevel,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setIsLoading(false)
      return
    }

    async function checkSession() {
      const result = await api.getCurrentUser()
      if (result.data?.user) {
        setUser(apiUserToUser(result.data.user))
      }
      setIsLoading(false)
    }
    checkSession()
  }, [])

  const refreshUser = useCallback(async () => {
    if (USE_MOCK_DATA) return

    const result = await api.getCurrentUser()
    if (result.data?.user) {
      setUser(apiUserToUser(result.data.user))
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    if (USE_MOCK_DATA) {
      // Mock login behavior
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (foundUser) {
        setUser(foundUser)
        setIsLoading(false)
        return { success: true }
      }
      // Create mock user if not found
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        name: email.split("@")[0],
        username: email.split("@")[0].toLowerCase(),
        role: "model",
        verified: false,
        avatar: "/placeholder.svg?height=400&width=400",
        bio: "",
        location: "",
        followers: 0,
        following: 0,
        createdAt: new Date(),
      }
      setUser(newUser)
      setIsLoading(false)
      return { success: true }
    }

    // Real API login
    const result = await api.login(email, password)
    setIsLoading(false)

    if (result.error) {
      return { success: false, error: result.error }
    }

    if (result.data?.user) {
      setUser(apiUserToUser(result.data.user))
      return { success: true }
    }

    return { success: false, error: "Invalid response from server" }
  }, [])

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setIsLoading(true)

    if (USE_MOCK_DATA) {
      // Mock signup behavior
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const newUser: User = {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        username: data.username,
        role: data.role,
        verified: false,
        avatar: "/placeholder.svg?height=400&width=400",
        bio: "",
        location: "",
        followers: 0,
        following: 0,
        createdAt: new Date(),
      }
      setUser(newUser)
      setIsLoading(false)
      return true
    }

    // Real API signup
    console.log("[v0] Attempting signup with:", { email: data.email, name: data.name, role: data.role, username: data.username })
    const result = await api.signup(data.email, data.password, data.name, data.role, data.username)
    console.log("[v0] Signup result:", result)
    setIsLoading(false)

    if (result.error) {
      console.error("[v0] Signup error:", result.error)
      return false
    }

    if (result.data?.user) {
      setUser(apiUserToUser(result.data.user))
      return true
    }

    return false
  }, [])

  const logout = useCallback(async () => {
    if (!USE_MOCK_DATA) {
      await api.logout()
    }
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
