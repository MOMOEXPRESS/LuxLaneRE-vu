import { api } from "./api-client"

export async function uploadFile(file: File, type: string = "PORTFOLIO"): Promise<string | null> {
  try {
    // Step 1: Get presigned URL / upload endpoint
    const presignRes = await api.getPresignedUrl(file.name, file.type, type)
    const presignData = presignRes.data as { uploadUrl?: string; publicUrl?: string } | undefined
    if (!presignData?.uploadUrl) return null

    // Step 2: Upload the file
    const formData = new FormData()
    formData.append("file", file)

    const uploadRes = await fetch(presignData.uploadUrl, {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!uploadRes.ok) return null
    const uploadData = await uploadRes.json()

    // Step 3: Confirm the media asset
    await api.confirmMedia({
      url: uploadData.url || presignData.publicUrl,
      type,
    })

    return uploadData.url || presignData.publicUrl || null
  } catch (error) {
    console.error("Upload failed:", error)
    return null
  }
}

export async function uploadAvatar(file: File): Promise<string | null> {
  return uploadFile(file, "AVATAR")
}

export async function uploadPortfolioImage(file: File): Promise<string | null> {
  return uploadFile(file, "PORTFOLIO")
}
