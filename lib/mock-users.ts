import { TEST_PASSWORD, TEST_ACCOUNTS } from "./test-credentials"
import type { AuthUser, UserRole } from "./auth"

export interface MockUser {
  id: string
  email: string
  username: string
  role: UserRole
  displayName: string
  avatarUrl: string | null
}

// Build a flat list of mock users from test credentials with deterministic IDs
const allMockUsers: MockUser[] = [
  ...TEST_ACCOUNTS.brands.map((a, i) => ({
    id: `mock-brand-${i}`,
    email: a.email,
    username: a.username,
    role: "brand" as UserRole,
    displayName: a.username.charAt(0).toUpperCase() + a.username.slice(1),
    avatarUrl: null,
  })),
  ...TEST_ACCOUNTS.agencies.map((a, i) => ({
    id: `mock-agency-${i}`,
    email: a.email,
    username: a.username,
    role: "agency" as UserRole,
    displayName: a.username.charAt(0).toUpperCase() + a.username.slice(1),
    avatarUrl: null,
  })),
  ...TEST_ACCOUNTS.models.map((a, i) => ({
    id: `mock-model-${i}`,
    email: a.email,
    username: a.username,
    role: "model" as UserRole,
    displayName: a.username.charAt(0).toUpperCase() + a.username.slice(1),
    avatarUrl: null,
  })),
]

const mockUsersByEmail = new Map(allMockUsers.map((u) => [u.email, u]))
const mockUsersById = new Map(allMockUsers.map((u) => [u.id, u]))

export { TEST_PASSWORD }

export function findMockUserByEmail(email: string): MockUser | undefined {
  return mockUsersByEmail.get(email)
}

export function findMockUserById(id: string): MockUser | undefined {
  return mockUsersById.get(id)
}

export function mockUserToAuthUser(mock: MockUser): AuthUser {
  return {
    id: mock.id,
    email: mock.email,
    role: mock.role,
    username: mock.username,
    displayName: mock.displayName,
    avatarUrl: mock.avatarUrl,
    isVerified: false,
    onboardingComplete: true,
  }
}
