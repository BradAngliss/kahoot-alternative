import { Json } from '@/types/supabase'
import { Answer, Question } from '@/types/types'
import { SliderSettings, TypeAnswerSettings } from './types'

const field = (json: Json, key: string): Json | undefined =>
  json && typeof json === 'object' && !Array.isArray(json) ? json[key] : undefined

/** Choices picked in an answer, in the order the player gave them. */
export const answerChoiceIds = (answer: Answer): string[] => {
  const ids = field(answer.response, 'choice_ids')
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
}

export const answerText = (answer: Answer): string | null => {
  const text = field(answer.response, 'text')
  return typeof text === 'string' ? text : null
}

export const answerValue = (answer: Answer): number | null => {
  const value = field(answer.response, 'value')
  return typeof value === 'number' ? value : null
}

export const typeAnswerSettings = (question: Question): TypeAnswerSettings => {
  const accepted = field(question.settings, 'accepted_answers')
  return {
    accepted_answers: Array.isArray(accepted)
      ? accepted.filter((answer): answer is string => typeof answer === 'string')
      : [],
  }
}

export const sliderSettings = (question: Question): SliderSettings => {
  const number = (key: string, fallback?: number) => {
    const value = field(question.settings, key)
    return typeof value === 'number' ? value : fallback
  }
  const unit = field(question.settings, 'unit')
  return {
    min: number('min', 0)!,
    max: number('max', 100)!,
    step: number('step', 1),
    answer: number('answer', 0)!,
    margin: number('margin'),
    unit: typeof unit === 'string' ? unit : undefined,
  }
}

/** Same rule as grade_answer: ignore case and extra spaces. */
export const normalizeText = (text: string) =>
  text.trim().replace(/\s+/g, ' ').toLowerCase()

/** Choices in the order they were added, which is the correct order for ordering questions. */
export const choicesInPosition = (question: Question) =>
  [...question.choices].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

/** A random order, different from the correct one when there is more than one item. */
export const shuffled = <T,>(items: T[]): T[] => {
  if (items.length < 2) return items
  let result = items
  while (result.every((item, index) => item === items[index])) {
    result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
  }
  return result
}
