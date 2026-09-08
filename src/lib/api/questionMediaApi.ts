import { apiFetch } from '@/lib/apiClient'

export interface QuestionMediaUploadResult {
  key: string
  url: string
}

export async function uploadQuestionMedia(file: File): Promise<QuestionMediaUploadResult> {
  const body = new FormData()
  body.append('file', file)
  return apiFetch<QuestionMediaUploadResult>('/question-media', {
    method: 'POST',
    body,
  })
}

export async function uploadQuestionMediaBlob(
  blob: Blob,
  filename = 'image.jpg',
): Promise<QuestionMediaUploadResult> {
  const type = blob.type || 'image/jpeg'
  const file = new File([blob], filename, { type })
  return uploadQuestionMedia(file)
}
