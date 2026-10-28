import { Answer, Question } from '@/types/types'
import { ComponentType } from 'react'

/**
 * What a player submits for a question, stored in answers.response and graded
 * by grade_answer in the database.
 */
export type ChoiceResponse = { choice_ids: string[] }
export type TextResponse = { text: string }
export type NumberResponse = { value: number }
export type AnswerResponse = ChoiceResponse | TextResponse | NumberResponse

/** What the database said about a player's answer. */
export type AnswerResult = {
  isCorrect: boolean
  /** From 0 (wrong) to 1 (fully correct) */
  correctness: number
  score: number
}

/** questions.settings for type_answer questions */
export type TypeAnswerSettings = { accepted_answers: string[] }

/** questions.settings for slider questions */
export type SliderSettings = {
  min: number
  max: number
  step?: number
  answer: number
  /** How far from the answer still scores some points. Defaults to a quarter of the range. */
  margin?: number
  unit?: string
}

export type HostViewProps = {
  question: Question
  isAnswerRevealed: boolean
}

export type RevealViewProps = {
  question: Question
  answers: Answer[]
}

export type PlayerViewProps = {
  question: Question
  onAnswer: (response: AnswerResponse) => void
  /**
   * Becomes true just before time runs out. Views with a Submit button then
   * send whatever is on screen (see useAutoSubmit).
   */
  isTimeUp: boolean
}

/**
 * The screens one kind of question needs. The shared quiz screens handle the
 * question text, timers, answer count, Next button and progress footer.
 */
export type QuizVariant = {
  /** Host screen once answering opens: what players are choosing from. */
  HostView: ComponentType<HostViewProps>
  /** Host screen after time is up: how players answered. */
  RevealView: ComponentType<RevealViewProps>
  /** Player screen while answering. */
  PlayerView: ComponentType<PlayerViewProps>
  /** Whether answers can be right or wrong. Polls are not scored. */
  scored: boolean
}
