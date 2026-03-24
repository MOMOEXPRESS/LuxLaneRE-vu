/**
 * Simple file upload — posts directly to /api/media/upload
 * Returns the public URL on success, null on failure.
 */
export async function uploadFile(file: File, type: string = "portfolio"): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    const res = await fetch("/api/media/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.url || null
  } catch (error) {
    console.error("Upload failed:", error)
    return null
  }
}

export async function uploadAvatar(file: File): Promise<string | null> {
  return uploadFile(file, "avatar")
}

export async function uploadPortfolioImage(file: File): Promise<string | null> {
  return uploadFile(file, "portfolio")
}

export async function uploadPostImage(file: File): Promise<string | null> {
  return uploadFile(file, "post")
}
