import { Answer, Question } from '@/types/types'
import { ComponentType } from 'react'

/** What a player submitted for a question, as the shared quiz screens need it. */
export type PlayerAnswer = {
  choiceId: string | null
  isCorrect: boolean
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
  onAnswer: (answer: PlayerAnswer) => void
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
}
