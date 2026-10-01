import { describe, expect, it } from 'vitest'
import { topicDisplayName } from '@/modules/reports/learningGenome/KnowledgeDistribution'

describe('topicDisplayName', () => {
  it('strips repeated chapter prefixes from concept labels', () => {
    expect(
      topicDisplayName('Basic Python Programming - Variables', 'Basic Python Programming'),
    ).toBe('Variables')
    expect(
      topicDisplayName('Basic Python Programming · Loops', 'Basic Python Programming'),
    ).toBe('Loops')
  })

  it('keeps concept when it does not repeat the chapter', () => {
    expect(topicDisplayName('Variables', 'Basic Python Programming')).toBe('Variables')
  })
})
