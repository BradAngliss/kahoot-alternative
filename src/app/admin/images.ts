import { adminSupabase } from './supabase'

const BUCKET = 'question-images'

/** Also enforced by the bucket. See 20261030150000_question_images.sql */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Uploads a picture and returns its public URL. */
export const uploadImage = async (file: File) => {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const { error } = await adminSupabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return adminSupabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Deletes pictures nothing uses any more. If this fails the pack is still fine,
 * and all that's left behind is an unused file, so failures are only logged.
 */
export const removeImages = async (urls: string[]) => {
  const paths = urls.flatMap((url) => url.split(`/${BUCKET}/`)[1] ?? [])
  if (paths.length === 0) return
  const { error } = await adminSupabase.storage.from(BUCKET).remove(paths)
  if (error) console.error(error.message)
}
