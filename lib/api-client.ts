// API Client for making requests to the backend
const API_BASE = ""

export interface AgencyRosterSubmission {
  id: string
  status: string
  submittedAt: string
  casting: {
    id: string
    title: string
    type: string
    status: string
    location: string | null
    startDate: string | null
    endDate: string | null
    deadline: string | null
  } | null
}

export interface AgencyRosterItem {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  location: string | null
  bio: string | null
  verificationStatus: string
  availability: string
  luxlaneScore: number
  submissions: AgencyRosterSubmission[]
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST", credentials: "include" })
      return res.ok
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<ApiResponse<T>> {
  if (response.status === 401 && retryFn) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      const retryResponse = await retryFn()
      if (retryResponse.ok) {
        const data = await retryResponse.json()
        return { data }
      }
    }
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }))
    return { error: errorData.error || `Error: ${response.status}` }
  }
  const data = await response.json()
  return { data }
}

export const api = {
  // Auth
  async signup(email: string, password: string, displayName: string, role: string, username?: string) {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, displayName, role, username }),
    })
    return handleResponse(response)
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(response)
  },

  async logout() {
    const response = await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" })
    return handleResponse(response)
  },

  async refreshToken() {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST" })
    return handleResponse(response)
  },

  async getCurrentUser() {
    const doFetch = () => fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
    const response = await doFetch()
    return handleResponse(response, doFetch)
  },

  async getSettings() {
    const response = await fetch(`${API_BASE}/api/settings`, { credentials: "include" })
    return handleResponse(response)
  },

  async updateSettings(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
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
    const response = await fetch(`${API_BASE}/api/profiles/${username}`, { credentials: "include" })
    return handleResponse(response)
  },

  async updateModelProfile(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/api/profiles/model`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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

  // Agency roster (My Models)
  async getAgencyRoster() {
    const response = await fetch(`${API_BASE}/api/agency/models`, { credentials: "include" })
    return handleResponse<{ roster: AgencyRosterItem[] }>(response)
  },

  // Agency roster management
  async inviteModelToAgency(modelId: string, note?: string) {
    const response = await fetch(`${API_BASE}/api/agency/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ modelId, note }),
    })
    return handleResponse(response)
  },

  async removeModelFromAgency(modelId: string) {
    const response = await fetch(`${API_BASE}/api/agency/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ modelId }),
    })
    return handleResponse(response)
  },

  async getAgencyApplications(status?: string) {
    const params = status ? `?status=${status}` : ""
    const response = await fetch(`${API_BASE}/api/agency/applications${params}`, { credentials: "include" })
    return handleResponse(response)
  },

  async applyToAgency(agencyId: string, note?: string) {
    const response = await fetch(`${API_BASE}/api/agency/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ agencyId, note }),
    })
    return handleResponse(response)
  },

  async respondToAgencyApplication(applicationId: string, action: "accept" | "reject") {
    const response = await fetch(`${API_BASE}/api/agency/applications/${applicationId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    })
    return handleResponse(response)
  },

  // Availability calendar
  async getAvailability(month?: string, userId?: string) {
    const params = new URLSearchParams()
    if (month) params.set("month", month)
    if (userId) params.set("userId", userId)
    const response = await fetch(`${API_BASE}/api/availability?${params}`, { credentials: "include" })
    return handleResponse(response)
  },

  async setAvailability(dates: Array<{ date: string; status: string }>) {
    const response = await fetch(`${API_BASE}/api/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dates }),
    })
    return handleResponse(response)
  },

  async deleteAvailability(dates: string[]) {
    const response = await fetch(`${API_BASE}/api/availability`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dates }),
    })
    return handleResponse(response)
  },

  // Posts (feed)
  async getPosts(params?: { limit?: number; cursor?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.cursor) searchParams.set("cursor", params.cursor)
    const url = `${API_BASE}/api/posts${searchParams.toString() ? `?${searchParams}` : ""}`
    const response = await fetch(url, { credentials: "include" })
    return handleResponse(response)
  },

  async createPost(data: { imageUrl: string; caption?: string }) {
    const response = await fetch(`${API_BASE}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async likePost(postId: string) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
      method: "POST",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async unlikePost(postId: string) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async savePost(postId: string) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/save`, {
      method: "POST",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async unsavePost(postId: string) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/save`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async getComments(postId: string) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`, { credentials: "include" })
    return handleResponse(response)
  },

  async addComment(postId: string, body: string) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    })
    return handleResponse(response)
  },

  // Castings
  async getCastings(params?: { status?: string; query?: string; creatorId?: string; limit?: number; type?: string; payMin?: number; payMax?: number; location?: string; sortBy?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.query) searchParams.set("query", params.query)
    if (params?.creatorId) searchParams.set("creatorId", params.creatorId)
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.type) searchParams.set("type", params.type)
    if (params?.payMin !== undefined && params.payMin !== null) searchParams.set("payMin", String(params.payMin))
    if (params?.payMax !== undefined && params.payMax !== null) searchParams.set("payMax", String(params.payMax))
    if (params?.location) searchParams.set("location", params.location)
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy)

    const doFetch = () => fetch(`${API_BASE}/api/castings?${searchParams}`)
    const response = await doFetch()
    return handleResponse(response, doFetch)
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
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getCastingSubmission(castingId: string) {
    const response = await fetch(`${API_BASE}/api/castings/${castingId}/submission`, { credentials: "include" })
    return handleResponse(response)
  },

  async saveCasting(castingId: string) {
    const response = await fetch(`${API_BASE}/api/castings/${castingId}/saved`, {
      method: "POST",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async unsaveCasting(castingId: string) {
    const response = await fetch(`${API_BASE}/api/castings/${castingId}/saved`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async getCastingSaved(castingId: string) {
    const response = await fetch(`${API_BASE}/api/castings/${castingId}/saved`, { credentials: "include" })
    return handleResponse(response)
  },

  async getCastingTopMatches(castingId: string, limit = 10) {
    const response = await fetch(
      `${API_BASE}/api/castings/${castingId}/top-matches?limit=${limit}`,
      { credentials: "include" }
    )
    return handleResponse<{ matches: Array<{ model: Record<string, unknown>; fitScore: Record<string, unknown> }> }>(response)
  },

  async inviteModelToCasting(castingId: string, modelId: string) {
    const response = await fetch(`${API_BASE}/api/castings/${castingId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ modelId }),
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
    const doFetch = () => fetch(url, { credentials: "include" })
    const response = await doFetch()
    return handleResponse(response, doFetch)
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
    const doFetch = () => fetch(`${API_BASE}/api/conversations`, { credentials: "include" })
    const response = await doFetch()
    return handleResponse(response, doFetch)
  },

  async startDirectConversation(userId: string) {
    const response = await fetch(`${API_BASE}/api/conversations/direct/${userId}`, {
      method: "POST",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async getMessages(conversationId: string, before?: string) {
    const url = before
      ? `${API_BASE}/api/conversations/${conversationId}/messages?before=${before}`
      : `${API_BASE}/api/conversations/${conversationId}/messages`
    const response = await fetch(url, { credentials: "include" })
    return handleResponse(response)
  },

  async sendMessage(conversationId: string, content: string, attachments?: string[]) {
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
      credentials: "include",
      body: JSON.stringify({ filename, contentType, type }),
    })
    return handleResponse(response)
  },

  async confirmMedia(data: { url: string; type: string; meta?: Record<string, unknown> }) {
    const response = await fetch(`${API_BASE}/api/media/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  /** Add a portfolio image by URL (MVP: paste public image URL). */
  async addPortfolioImage(url: string) {
    return this.confirmMedia({ url, type: "PORTFOLIO" })
  },

  // Casting Rooms
  async getCastingRoom(castingId: string) {
    const response = await fetch(`${API_BASE}/api/casting-rooms?castingId=${castingId}`, { credentials: "include" })
    return handleResponse(response)
  },

  async createCastingRoom(castingId: string) {
    const response = await fetch(`${API_BASE}/api/casting-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ castingId }),
    })
    return handleResponse(response)
  },

  async getRoomEvents(roomId: string) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/events`, { credentials: "include" })
    return handleResponse(response)
  },

  async createRoomEvent(roomId: string, data: { type: string; targetUserId?: string; message?: string }) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getRoomFiles(roomId: string) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/files`, { credentials: "include" })
    return handleResponse(response)
  },

  async uploadRoomFile(roomId: string, data: { name: string; type: string; url: string }) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getRoomSchedule(roomId: string) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/schedule`, { credentials: "include" })
    return handleResponse(response)
  },

  async addRoomScheduleItem(roomId: string, data: { title: string; date: string; time: string; location?: string; notes?: string }) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async getRoomMessages(roomId: string, before?: string) {
    const url = before
      ? `${API_BASE}/api/casting-rooms/${roomId}/messages?before=${before}`
      : `${API_BASE}/api/casting-rooms/${roomId}/messages`
    const response = await fetch(url, { credentials: "include" })
    return handleResponse(response)
  },

  async sendRoomMessage(roomId: string, content: string) {
    const response = await fetch(`${API_BASE}/api/casting-rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    })
    return handleResponse(response)
  },

  async getMedia(ownerId?: string, type?: string) {
    const params = new URLSearchParams()
    if (ownerId) params.set("ownerId", ownerId)
    if (type) params.set("type", type)
    const response = await fetch(`${API_BASE}/api/media?${params}`, { credentials: "include" })
    return handleResponse(response)
  },

  async deleteMedia(id: string) {
    const response = await fetch(`${API_BASE}/api/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async reorderMedia(orderedIds: string[]) {
    const response = await fetch(`${API_BASE}/api/media/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderedIds }),
    })
    return handleResponse(response)
  },

  // Block / Report
  async blockUser(username: string) {
    const response = await fetch(`${API_BASE}/api/users/${username}/block`, {
      method: "POST",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async unblockUser(username: string) {
    const response = await fetch(`${API_BASE}/api/users/${username}/block`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async checkBlocked(username: string) {
    const response = await fetch(`${API_BASE}/api/users/${username}/block`, { credentials: "include" })
    return handleResponse(response)
  },

  async reportUser(username: string, reason: string, details?: string) {
    const response = await fetch(`${API_BASE}/api/users/${username}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason, details }),
    })
    return handleResponse(response)
  },

  // Saved Models (Talent Pool)
  async getSavedModels() {
    const response = await fetch(`${API_BASE}/api/saved-models`, { credentials: "include" })
    return handleResponse(response)
  },

  async saveModel(modelId: string, note?: string) {
    const response = await fetch(`${API_BASE}/api/saved-models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ modelId, note }),
    })
    return handleResponse(response)
  },

  async unsaveModel(modelId: string) {
    const response = await fetch(`${API_BASE}/api/saved-models`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ modelId }),
    })
    return handleResponse(response)
  },

  // Job History
  async getJobHistory(params?: { status?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    const response = await fetch(`${API_BASE}/api/submissions/history?${searchParams}`, { credentials: "include" })
    return handleResponse(response)
  },

  // Bulk Actions
  async bulkAction(castingId: string, data: { action: string; submissionIds?: string[]; modelIds?: string[] }) {
    const response = await fetch(`${API_BASE}/api/castings/${castingId}/bulk-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // ─── Phase 3: Analytics ───

  async getProfileAnalytics(profileId?: string) {
    const params = profileId ? `?profileId=${profileId}` : ""
    const response = await fetch(`${API_BASE}/api/analytics/profile${params}`, { credentials: "include" })
    return handleResponse(response)
  },

  async trackProfileView(profileId: string, source?: string) {
    const response = await fetch(`${API_BASE}/api/analytics/profile/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ profileId, source }),
    })
    return handleResponse(response)
  },

  async getCastingAnalytics(castingId: string) {
    const response = await fetch(`${API_BASE}/api/analytics/casting?castingId=${castingId}`, { credentials: "include" })
    return handleResponse(response)
  },

  async trackCastingView(castingId: string) {
    const response = await fetch(`${API_BASE}/api/analytics/casting/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ castingId }),
    })
    return handleResponse(response)
  },

  // ─── Phase 3: Earnings ───

  async getEarnings(params?: { status?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    const response = await fetch(`${API_BASE}/api/earnings?${searchParams}`, { credentials: "include" })
    return handleResponse(response)
  },

  // ─── Phase 3: Stories ───

  async getStoryFeed() {
    const response = await fetch(`${API_BASE}/api/stories`, { credentials: "include" })
    return handleResponse(response)
  },

  async getUserStories(userId: string) {
    const response = await fetch(`${API_BASE}/api/stories?userId=${userId}`, { credentials: "include" })
    return handleResponse(response)
  },

  async createStory(data: { mediaUrl: string; mediaType?: string; caption?: string }) {
    const response = await fetch(`${API_BASE}/api/stories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async deleteStory(storyId: string) {
    const response = await fetch(`${API_BASE}/api/stories/${storyId}`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  async viewStory(storyId: string) {
    const response = await fetch(`${API_BASE}/api/stories/${storyId}/view`, {
      method: "POST",
      credentials: "include",
    })
    return handleResponse(response)
  },

  // ─── Phase 3: Highlights ───

  async getHighlights(userId: string) {
    const response = await fetch(`${API_BASE}/api/highlights?userId=${userId}`, { credentials: "include" })
    return handleResponse(response)
  },

  async createHighlight(data: { title: string; coverUrl?: string; storyIds?: string[] }) {
    const response = await fetch(`${API_BASE}/api/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async updateHighlight(id: string, data: { title?: string; coverUrl?: string; addStoryIds?: string[]; removeStoryIds?: string[] }) {
    const response = await fetch(`${API_BASE}/api/highlights/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async deleteHighlight(id: string) {
    const response = await fetch(`${API_BASE}/api/highlights/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse(response)
  },

  // ─── Direct Bookings ───

  async getBookings() {
    const response = await fetch(`${API_BASE}/api/bookings`, { credentials: "include" })
    return handleResponse(response)
  },

  async createBooking(data: {
    modelId: string
    title: string
    description?: string
    location?: string
    startDate?: string
    endDate?: string
    payAmount?: number
  }) {
    const response = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async updateBooking(id: string, data: { status: string }) {
    const response = await fetch(`${API_BASE}/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // ─── Moderation Reports ───

  async getReports(status?: string) {
    const params = status ? `?status=${status}` : ""
    const response = await fetch(`${API_BASE}/api/reports${params}`, { credentials: "include" })
    return handleResponse(response)
  },

  async updateReport(id: string, status: string) {
    const response = await fetch(`${API_BASE}/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    })
    return handleResponse(response)
  },
}

export const apiClient = api
