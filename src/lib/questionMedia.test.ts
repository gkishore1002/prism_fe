import { describe, expect, it } from 'vitest'
import { questionMediaPath, toQuestionMediaFetchPath } from '@/lib/questionMedia'

describe('questionMediaPath', () => {
  it('uses the API url when present', () => {
    expect(questionMediaPath('/question-media/inst-1/abc.jpg')).toBe('/question-media/inst-1/abc.jpg')
  })

  it('builds a path from a stored key', () => {
    expect(questionMediaPath(undefined, 'inst-1/abc.jpg')).toBe('/question-media/inst-1/abc.jpg')
  })

  it('treats a bare key stored in the url field as media', () => {
    expect(questionMediaPath('inst-1/abc.jpg')).toBe('/question-media/inst-1/abc.jpg')
  })

  it('strips an accidental /api/v1 prefix', () => {
    expect(questionMediaPath('/api/v1/question-media/inst-1/abc.jpg')).toBe(
      '/question-media/inst-1/abc.jpg',
    )
  })

  it('extracts the media path from an absolute API url', () => {
    expect(questionMediaPath('http://127.0.0.1:8002/api/v1/question-media/inst-1/abc.jpg')).toBe(
      '/question-media/inst-1/abc.jpg',
    )
  })

  it('encodes path segments for fetch', () => {
    expect(toQuestionMediaFetchPath(undefined, 'inst-1/ab c.jpg')).toBe(
      '/question-media/inst-1/ab%20c.jpg',
    )
  })
})
