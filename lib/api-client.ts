// API Client for making requests to the backend
const API_BASE = ""

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }))
    return { error: errorData.error || `Error: ${response.status}` }
  }
  const data = await response.json()
  return { data }
}

export const api = {
  // Auth
  async signup(email: string, password: string, displayName: string, role: string) {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, role }),
    })
    return handleResponse(response)
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(response)
  },

  async logout() {
    const response = await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" })
    return handleResponse(response)
  },

  async refreshToken() {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST" })
    return handleResponse(response)
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/api/auth/me`)
    return handleResponse(response)
  },

  // Profiles
  async getMyProfile() {
    const response = await fetch(`${API_BASE}/api/profiles/me`)
    return handleResponse(response)
  },

  async updateMyProfile(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/profiles/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getProfile(username: string) {
    const response = await fetch(`${API_BASE}/api/profiles/${username}`)
    return handleResponse(response)
  },

  async updateModelProfile(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/profiles/model`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async completeOnboarding(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // Follows
  async follow(userId: string) {
    const response = await fetch(`${API_BASE}/api/follows/${userId}`, { method: "POST" })
    return handleResponse(response)
  },

  async unfollow(userId: string) {
    const response = await fetch(`${API_BASE}/api/follows/${userId}`, { method: "DELETE" })
    return handleResponse(response)
  },

  // Castings
  async getCastings(params?: { status?: string; query?: string; creatorId?: string; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.query) searchParams.set("query", params.query)
    if (params?.creatorId) searchParams.set("creatorId", params.creatorId)
    if (params?.limit) searchParams.set("limit", String(params.limit))

    const response = await fetch(`${API_BASE}/api/castings?${searchParams}`)
    return handleResponse(response)
  },

  async getCasting(id: string) {
    const response = await fetch(`${API_BASE}/api/castings/${id}`)
    return handleResponse(response)
  },

  async createCasting(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/castings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async updateCasting(id: string, data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/castings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async activateCasting(id: string) {
    const response = await fetch(`${API_BASE}/api/castings/${id}/activate`, { method: "POST" })
    return handleResponse(response)
  },

  async closeCasting(id: string) {
    const response = await fetch(`${API_BASE}/api/castings/${id}/close`, { method: "POST" })
    return handleResponse(response)
  },

  async applyToCasting(id: string, data: { note?: string; portfolioIds?: string[] }) {
    const response = await fetch(`${API_BASE}/api/castings/${id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async submitModelsToCasting(id: string, data: { modelIds: string[]; note?: string }) {
    const response = await fetch(`${API_BASE}/api/castings/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getSubmissions(castingId: string, status?: string) {
    const url = status
      ? `${API_BASE}/api/castings/${castingId}/submissions?status=${status}`
      : `${API_BASE}/api/castings/${castingId}/submissions`
    const response = await fetch(url)
    return handleResponse(response)
  },

  async updateSubmissionStatus(submissionId: string, status: string) {
    const response = await fetch(`${API_BASE}/api/submissions/${submissionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    return handleResponse(response)
  },

  async acceptOffer(submissionId: string) {
    const response = await fetch(`${API_BASE}/api/submissions/${submissionId}/accept`, { method: "POST" })
    return handleResponse(response)
  },

  async declineOffer(submissionId: string) {
    const response = await fetch(`${API_BASE}/api/submissions/${submissionId}/decline`, { method: "POST" })
    return handleResponse(response)
  },

  // Notifications
  async getNotifications(unreadOnly?: boolean) {
    const url = unreadOnly ? `${API_BASE}/api/notifications?unread=true` : `${API_BASE}/api/notifications`
    const response = await fetch(url)
    return handleResponse(response)
  },

  async markNotificationRead(id: string) {
    const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: "PATCH" })
    return handleResponse(response)
  },

  async markAllNotificationsRead() {
    const response = await fetch(`${API_BASE}/api/notifications/read-all`, { method: "POST" })
    return handleResponse(response)
  },

  // Conversations
  async getConversations() {
    const response = await fetch(`${API_BASE}/api/conversations`)
    return handleResponse(response)
  },

  async startDirectConversation(userId: string) {
    const response = await fetch(`${API_BASE}/api/conversations/direct/${userId}`, { method: "POST" })
    return handleResponse(response)
  },

  async getMessages(conversationId: string, before?: string) {
    const url = before
      ? `${API_BASE}/api/conversations/${conversationId}/messages?before=${before}`
      : `${API_BASE}/api/conversations/${conversationId}/messages`
    const response = await fetch(url)
    return handleResponse(response)
  },

  async sendMessage(conversationId: string, content: string, attachments?: string[]) {
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, attachments }),
    })
    return handleResponse(response)
  },

  // Scoreboard
  async getScoreboard(filter?: string, limit?: number) {
    const params = new URLSearchParams()
    if (filter) params.set("filter", filter)
    if (limit) params.set("limit", String(limit))
    const response = await fetch(`${API_BASE}/api/scoreboard?${params}`)
    return handleResponse(response)
  },

  async getTopModels(filter?: string, limit?: number) {
    const params = new URLSearchParams()
    if (filter) params.set("filter", filter)
    if (limit) params.set("limit", String(limit))
    const response = await fetch(`${API_BASE}/api/models/top?${params}`)
    return handleResponse(response)
  },

  // Digital Twin
  async getMyDigitalTwin() {
    const response = await fetch(`${API_BASE}/api/digital-twin`)
    return handleResponse(response)
  },

  async startDigitalTwin() {
    const response = await fetch(`${API_BASE}/api/digital-twin`, { method: "POST" })
    return handleResponse(response)
  },

  async completeDigitalTwinUpload(inputUrls: string[]) {
    const response = await fetch(`${API_BASE}/api/digital-twin/upload-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputUrls }),
    })
    return handleResponse(response)
  },

  async getDigitalTwin(username: string) {
    const response = await fetch(`${API_BASE}/api/digital-twin/${username}`)
    return handleResponse(response)
  },

  // Media
  async getPresignedUrl(filename: string, contentType: string, type: string) {
    const response = await fetch(`${API_BASE}/api/media/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType, type }),
    })
    return handleResponse(response)
  },

  async confirmMedia(data: { key: string; url: string; thumbnailUrl?: string; type: string; caption?: string }) {
    const response = await fetch(`${API_BASE}/api/media/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getMedia(ownerId?: string, type?: string) {
    const params = new URLSearchParams()
    if (ownerId) params.set("ownerId", ownerId)
    if (type) params.set("type", type)
    const response = await fetch(`${API_BASE}/api/media?${params}`)
    return handleResponse(response)
  },
}

export const apiClient = api
